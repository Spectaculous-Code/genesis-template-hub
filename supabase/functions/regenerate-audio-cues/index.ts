import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting regeneration of missing audio cues...");

    // Find all audio assets that don't have cues
    const { data: audioAssets, error: audioError } = await supabase
      .from("audio_assets")
      .select("id, chapter_id, version_id, duration_ms");

    if (audioError) {
      throw new Error(`Failed to fetch audio assets: ${audioError.message}`);
    }

    console.log(`Found ${audioAssets?.length || 0} total audio assets`);

    const results = {
      processed: 0,
      created: 0,
      skipped: 0,
      errors: 0,
    };

    for (const asset of audioAssets || []) {
      try {
        // Check if cues already exist
        const { data: existingCues } = await supabase
          .from("audio_cues")
          .select("id")
          .eq("audio_id", asset.id)
          .limit(1);

        if (existingCues && existingCues.length > 0) {
          console.log(`Skipping audio ${asset.id} - cues already exist`);
          results.skipped++;
          continue;
        }

        // Get chapter info from bible_schema to find the corresponding public.verses
        const { data: chapterInfo, error: chapterError } = await supabase
          .schema('bible_schema')
          .from("chapters")
          .select("chapter_number, book_id, books!inner(name, version_id, bible_versions!inner(code))")
          .eq("id", asset.chapter_id)
          .single();

        if (chapterError || !chapterInfo) {
          console.error(`Failed to get chapter info for audio ${asset.id}:`, chapterError);
          results.errors++;
          continue;
        }

        // Get the version code from bible_schema
        const versionCode = (chapterInfo.books as any).bible_versions.code;
        
        // Find the corresponding version in public schema by code
        const { data: publicVersion } = await supabase
          .from("bible_versions")
          .select("id")
          .ilike("code", `${versionCode}%`) // Use ilike with wildcard since codes might differ slightly
          .single();

        if (!publicVersion) {
          console.error(`Version not found in public schema for code ${versionCode}`);
          results.errors++;
          continue;
        }

        // Find corresponding public book using version_id from public schema
        const { data: publicBook } = await supabase
          .from("books")
          .select("id")
          .eq("name", (chapterInfo.books as any).name)
          .eq("version_id", publicVersion.id)
          .single();

        if (!publicBook) {
          console.error(`Book not found in public schema for audio ${asset.id}`);
          results.errors++;
          continue;
        }

        const { data: publicChapterData } = await supabase
          .from("chapters")
          .select("id")
          .eq("book_id", publicBook.id)
          .eq("chapter_number", chapterInfo.chapter_number)
          .single();

        if (!publicChapterData) {
          console.error(`Chapter not found in public schema for audio ${asset.id}`);
          results.errors++;
          continue;
        }

        // Fetch verses from public.verses using the public chapter_id and version_id
        const { data: verses, error: versesError } = await supabase
          .from("verses")
          .select("id, verse_number, text")
          .eq("chapter_id", publicChapterData.id)
          .eq("version_id", publicVersion.id)
          .eq("is_superseded", false)
          .order("verse_number", { ascending: true });

        if (versesError || !verses || verses.length === 0) {
          console.error(`No verses found for audio ${asset.id}`);
          results.errors++;
          continue;
        }

        // Calculate timing based on character count
        const duration_ms = asset.duration_ms || Math.round((verses.reduce((sum, v) => sum + v.text.length, 0) / 5 / 150) * 60 * 1000);
        
        let currentTimeMs = 0;
        const totalChars = verses.reduce((sum, v) => sum + v.text.length, 0);
        const msPerChar = duration_ms / totalChars;

        const audioCues = verses.map((verse) => {
          const verseChars = verse.text.length;
          const verseDuration = Math.round(verseChars * msPerChar);
          const cue = {
            audio_id: asset.id,
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
          console.error(`Error inserting cues for audio ${asset.id}:`, cuesError);
          results.errors++;
        } else {
          console.log(`Created ${audioCues.length} cues for audio ${asset.id}`);
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
