import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RegenerateRequest {
  audio_id?: string; // Optional: regenerate specific audio
  force?: boolean; // Force regeneration even if cues exist
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const elevenLabsKey = Deno.env.get("ELEVENLABS_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!elevenLabsKey) {
      throw new Error("ELEVENLABS_API_KEY not configured");
    }

    const { audio_id, force = false }: RegenerateRequest = req.method === "POST" 
      ? await req.json() 
      : {};

    console.log("Starting regeneration of audio cues with ElevenLabs Forced Alignment...");

    // Build query for audio assets
    let query = supabase
      .from("audio_assets")
      .select("id, chapter_id, version_id, duration_ms, file_url");

    if (audio_id) {
      query = query.eq("id", audio_id);
      console.log(`Targeting specific audio: ${audio_id}`);
    }

    const { data: audioAssets, error: audioError } = await query;

    if (audioError) {
      throw new Error(`Failed to fetch audio assets: ${audioError.message}`);
    }

    console.log(`Found ${audioAssets?.length || 0} audio assets to process`);

    const results = {
      processed: 0,
      created: 0,
      skipped: 0,
      errors: 0,
    };

    for (const asset of audioAssets || []) {
      try {
        console.log(`Processing audio ${asset.id}, chapter: ${asset.chapter_id}`);
        
        // Check if cues already exist
        const { data: existingCues } = await supabase
          .from("audio_cues")
          .select("id")
          .eq("audio_id", asset.id)
          .limit(1);

        if (existingCues && existingCues.length > 0 && !force) {
          console.log(`Skipping audio ${asset.id} - cues exist (use force=true to regenerate)`);
          results.skipped++;
          continue;
        }

        // Fetch verses
        const { data: verses, error: versesError } = await supabase
          .schema('bible_schema')
          .from("verses")
          .select("id, verse_number, text")
          .eq("chapter_id", asset.chapter_id)
          .eq("version_id", asset.version_id)
          .eq("is_superseded", false)
          .order("verse_number", { ascending: true });

        if (versesError || !verses || verses.length === 0) {
          console.error(`No verses found for audio ${asset.id}:`, versesError);
          results.errors++;
          continue;
        }

        console.log(`Found ${verses.length} verses, fetching audio from ${asset.file_url}`);

        // Download audio file from storage
        const audioResponse = await fetch(asset.file_url);
        if (!audioResponse.ok) {
          throw new Error(`Failed to download audio: ${audioResponse.statusText}`);
        }
        const audioBlob = await audioResponse.blob();
        
        // Combine verses into full text (matching generation)
        const fullText = verses.map((v) => v.text).join(" ");

        console.log(`Sending to ElevenLabs Forced Alignment API...`);

        // Call ElevenLabs Forced Alignment API
        const formData = new FormData();
        formData.append("file", audioBlob, "audio.mp3");
        formData.append("text", fullText);

        const alignResponse = await fetch(
          "https://api.elevenlabs.io/v1/audio-alignment",
          {
            method: "POST",
            headers: {
              "xi-api-key": elevenLabsKey,
            },
            body: formData,
          }
        );

        if (!alignResponse.ok) {
          const errorText = await alignResponse.text();
          console.error("ElevenLabs Alignment API error:", errorText);
          throw new Error(`Alignment failed: ${alignResponse.status}`);
        }

        const alignmentData = await alignResponse.json();
        console.log(`Received alignment data with ${alignmentData.characters?.length || 0} characters`);

        if (!alignmentData.characters || alignmentData.characters.length === 0) {
          throw new Error("No alignment data received from API");
        }

        // Calculate verse timings from character-level alignment
        const characters = alignmentData.characters;
        
        let charOffset = 0;
        const audioCues = verses.map((verse) => {
          const startCharIndex = charOffset;
          const endCharIndex = charOffset + verse.text.length - 1;
          
          // Ensure indices are within bounds
          const start_ms = startCharIndex < characters.length 
            ? Math.round(characters[startCharIndex].start_time * 1000)
            : 0;
          const end_ms = endCharIndex < characters.length
            ? Math.round(characters[endCharIndex].end_time * 1000)
            : start_ms + 1000;
          
          charOffset += verse.text.length + 1; // +1 for space separator
          
          return {
            audio_id: asset.id,
            verse_id: verse.id,
            start_ms,
            end_ms,
          };
        });

        // Delete existing cues if force mode
        if (force && existingCues && existingCues.length > 0) {
          await supabase
            .from("audio_cues")
            .delete()
            .eq("audio_id", asset.id);
          console.log(`Deleted ${existingCues.length} existing cues`);
        }

        // Insert new audio cues
        const { error: cuesError } = await supabase
          .from("audio_cues")
          .insert(audioCues);

        if (cuesError) {
          console.error(`Error inserting cues for audio ${asset.id}:`, cuesError);
          results.errors++;
        } else {
          console.log(`Created ${audioCues.length} precise cues for audio ${asset.id}`);
          results.created += audioCues.length;
          results.processed++;
        }
      } catch (error) {
        console.error(`Error processing audio ${asset.id}:`, error);
        results.errors++;
      }
    }

    console.log("Regeneration complete:", results);

    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in regenerate-audio-cues:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
