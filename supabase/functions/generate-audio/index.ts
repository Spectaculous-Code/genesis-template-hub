import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateAudioRequest {
  chapter_id: string;
  version_id: string;
  reader_key: string; // Format: "elevenlabs:voice_id" or "openai:voice"
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { chapter_id, version_id, reader_key }: GenerateAudioRequest = await req.json();

    if (!chapter_id || !version_id || !reader_key) {
      throw new Error("chapter_id, version_id, and reader_key are required");
    }

    // Parse reader_key (format: "provider:voice")
    const [provider, voice] = reader_key.split(":");
    if (!provider || !voice) {
      throw new Error("Invalid reader_key format. Expected 'provider:voice'");
    }

    // Generate hash: SHA-256(chapter_id + version_id + reader_key)
    const hashInput = `${chapter_id}${version_id}${reader_key}`;
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(hashInput)
    );
    const hash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Check if audio already exists
    const { data: existing } = await supabase
      .from("audio_assets")
      .select("id, file_url, duration_ms")
      .eq("hash", hash)
      .single();

    if (existing) {
      console.log(`Audio already exists for hash ${hash}`);
      
      // Check if audio cues exist for this audio
      const { data: cuesCheck } = await supabase
        .from("audio_cues")
        .select("id")
        .eq("audio_id", existing.id)
        .limit(1);

      // If cues don't exist, we need to regenerate them
      if (!cuesCheck || cuesCheck.length === 0) {
        console.log(`Audio cues missing for audio ${existing.id}, will regenerate`);
      } else {
        return new Response(
          JSON.stringify({
            audio_id: existing.id,
            file_url: existing.file_url,
            duration_ms: existing.duration_ms,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch chapter verses
    const { data: verses, error: versesError } = await supabase
      .schema('bible_schema')
      .from("verses")
      .select("id, verse_number, text")
      .eq("chapter_id", chapter_id)
      .eq("version_id", version_id)
      .eq("is_superseded", false)
      .order("verse_number", { ascending: true });

    if (versesError || !verses || verses.length === 0) {
      throw new Error("No verses found for this chapter");
    }

    // Combine verses into one text (without verse numbers)
    const fullText = verses
      .map((v) => v.text)
      .join(" ");

    console.log(`Generating TTS for ${verses.length} verses using ${reader_key}`);

    let audioBuffer: ArrayBuffer;

    if (provider === "elevenlabs") {
      // ElevenLabs TTS
      const elevenLabsKey = Deno.env.get("ELEVENLABS_API_KEY");
      if (!elevenLabsKey) {
        throw new Error("ELEVENLABS_API_KEY not configured");
      }

      const ttsResponse = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": elevenLabsKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: fullText,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (!ttsResponse.ok) {
        const errorText = await ttsResponse.text();
        console.error("ElevenLabs API error:", errorText);
        throw new Error(`ElevenLabs API error: ${ttsResponse.status}`);
      }

      audioBuffer = await ttsResponse.arrayBuffer();
    } else {
      throw new Error(`Unsupported TTS provider: ${provider}`);
    }

    // Upload to Supabase Storage: audio-chapters/audio/<hash>.mp3
    const filePath = `audio/${hash}.mp3`;
    const { error: uploadError } = await supabase.storage
      .from("audio-chapters")
      .upload(filePath, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: true, // Allow overwriting if file exists
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("audio-chapters")
      .getPublicUrl(filePath);

    const file_url = urlData.publicUrl;

    // Calculate duration (estimate: ~150 words per minute, ~5 chars per word)
    const wordCount = fullText.length / 5;
    const duration_ms = Math.round((wordCount / 150) * 60 * 1000);

    // Insert metadata
    const { data: audioAsset, error: insertError } = await supabase
      .from("audio_assets")
      .insert({
        hash,
        chapter_id,
        version_id,
        file_url,
        duration_ms,
        scope: "chapter",
        reader_key,
        tts_provider: provider,
        voice,
      })
      .select("id, file_url, duration_ms")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error(`Failed to save metadata: ${insertError.message}`);
    }

    // Create audio cues for verse timing
    // Calculate approximate timing based on character count
    let currentTimeMs = 0;
    const totalChars = verses.reduce((sum, v) => sum + v.text.length, 0);
    const msPerChar = duration_ms / totalChars;

    const audioCues = verses.map((verse) => {
      const verseChars = verse.text.length;
      const verseDuration = Math.round(verseChars * msPerChar);
      const cue = {
        audio_id: audioAsset.id,
        verse_id: verse.id,
        start_ms: currentTimeMs,
        end_ms: currentTimeMs + verseDuration,
      };
      currentTimeMs += verseDuration;
      return cue;
    });

    // Insert audio cues
    const { error: cuesError } = await supabase
      .from("audio_cues")
      .insert(audioCues);

    if (cuesError) {
      console.error("Error inserting audio cues:", cuesError);
      // Don't fail the request if cues fail, just log it
    }

    console.log(`Audio generated successfully: ${file_url}`);

    return new Response(
      JSON.stringify({
        audio_id: audioAsset.id,
        file_url: audioAsset.file_url,
        duration_ms: audioAsset.duration_ms,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-audio:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
