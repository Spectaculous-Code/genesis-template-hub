import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerseData {
  verse_number: number;
  text_content: string;
  book_name: string;
  chapter_number: number;
  verse_id: string;
  version_code: string;
}

interface AudioCue {
  start_ms: number;
  end_ms: number;
  verse_id: string;
}

interface AudioAsset {
  file_url: string;
  duration_ms: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const ref = url.searchParams.get('ref');
    const versionCode = url.searchParams.get('version') || 'finstlk201';

    if (!ref) {
      return new Response(
        JSON.stringify({ error: 'Missing ref parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing embed request:', { ref, versionCode });

    // Parse reference (e.g., "Joh.3:16-18" or "Joh.3:16")
    const parsed = parseReference(ref);
    if (!parsed) {
      return new Response(
        JSON.stringify({ error: 'Invalid reference format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { book, chapter, startVerse, endVerse } = parsed;
    console.log('Parsed reference:', { book, chapter, startVerse, endVerse });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build verse array for RPC call
    const verses = endVerse 
      ? Array.from({ length: endVerse - startVerse + 1 }, (_, i) => startVerse + i)
      : [startVerse];

    console.log('Fetching verses:', { book, chapter, verses, versionCode });

    // Fetch verses using RPC function
    const { data: versesData, error: versesError } = await supabase
      .rpc('get_verses_by_ref', {
        p_ref_book: book,
        p_chapter: chapter,
        p_verses: verses,
        p_version_code: versionCode,
        p_language_code: 'fi'
      });

    if (versesError) {
      console.error('Error fetching verses:', versesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch verses', details: versesError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!versesData || versesData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Verses not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found verses:', versesData.length);

    // Get version name
    const { data: versionData } = await supabase
      .from('bible_versions')
      .select('name')
      .eq('code', versionCode)
      .single();

    const versionName = versionData?.name || 'Suomalainen raamatunkäännös';

    // Get audio data for these verses
    const verseIds = versesData.map((v: VerseData) => v.verse_id);
    
    const { data: audioCues, error: cuesError } = await supabase
      .from('audio_cues')
      .select('start_ms, end_ms, verse_id, audio_id')
      .in('verse_id', verseIds)
      .order('start_ms', { ascending: true });

    if (cuesError) {
      console.error('Error fetching audio cues:', cuesError);
    }

    // Initialize audio data structure (always return an object)
    let audioData = {
      available: false,
      url: null,
      startTime: null,
      endTime: null
    };

    if (audioCues && audioCues.length > 0) {
      // Get audio asset for the first cue (they should all be from same audio file)
      const audioId = audioCues[0].audio_id;
      
      const { data: audioAsset, error: assetError } = await supabase
        .from('audio_assets')
        .select('file_url, duration_ms')
        .eq('id', audioId)
        .single();

      if (!assetError && audioAsset) {
        // Calculate combined audio range (min start, max end)
        const startMs = Math.min(...audioCues.map((cue: AudioCue) => cue.start_ms));
        const endMs = Math.max(...audioCues.map((cue: AudioCue) => cue.end_ms || cue.start_ms));

        audioData = {
          available: true,
          url: audioAsset.file_url,
          startTime: startMs / 1000, // Convert to seconds
          endTime: endMs / 1000      // Convert to seconds
        };

        console.log('Audio data:', audioData);
      }
    }

    // Format response
    const firstVerse = versesData[0] as VerseData;
    const reference = endVerse
      ? `${firstVerse.book_name} ${chapter}:${startVerse}-${endVerse}`
      : `${firstVerse.book_name} ${chapter}:${startVerse}`;

    const response = {
      reference,
      version: versionName,
      versionCode,
      verses: versesData.map((v: VerseData) => ({
        number: v.verse_number,
        text: v.text_content
      })),
      audio: audioData,
      link: `https://iryqgmjauybluwnqhxbg.supabase.co/?book=${encodeURIComponent(firstVerse.book_name)}&chapter=${chapter}&verse=${startVerse}`
    };

    console.log('Returning response:', response);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
        } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Parse Bible reference string
 * Supports formats:
 * - "Joh.3:16" or "Joh.3.16" (single verse)
 * - "Joh.3:16-18" or "Joh 3.16-18" (verse range)
 * - "Johannes 3:16-18" (with full book name)
 * - "John 3:16-18" (English names)
 */
function parseReference(ref: string): { book: string; chapter: number; startVerse: number; endVerse?: number } | null {
  // Remove extra whitespace
  ref = ref.trim();

  // Common abbreviations mapping (Finnish and English)
  const abbreviations: Record<string, string> = {
    // Finnish abbreviations
    'Matt': 'Matteus',
    'Matt.': 'Matteus',
    'Mark': 'Markus',
    'Mark.': 'Markus',
    'Luuk': 'Luukas',
    'Luuk.': 'Luukas',
    'Joh': 'Johannes',
    'Joh.': 'Johannes',
    '1.Moos': '1. Mooseksen kirja',
    '1. Moos': '1. Mooseksen kirja',
    '1 Moos': '1. Mooseksen kirja',
    '2.Moos': '2. Mooseksen kirja',
    '2. Moos': '2. Mooseksen kirja',
    '2 Moos': '2. Mooseksen kirja',
    '3.Moos': '3. Mooseksen kirja',
    '3. Moos': '3. Mooseksen kirja',
    '3 Moos': '3. Mooseksen kirja',
    '4.Moos': '4. Mooseksen kirja',
    '4. Moos': '4. Mooseksen kirja',
    '4 Moos': '4. Mooseksen kirja',
    '5.Moos': '5. Mooseksen kirja',
    '5. Moos': '5. Mooseksen kirja',
    '5 Moos': '5. Mooseksen kirja',
    '1.Sam': '1. Samuelin kirja',
    '1. Sam': '1. Samuelin kirja',
    '1 Sam': '1. Samuelin kirja',
    '2.Sam': '2. Samuelin kirja',
    '2. Sam': '2. Samuelin kirja',
    '2 Sam': '2. Samuelin kirja',
    '1.Kun': '1. Kuningasten kirja',
    '1. Kun': '1. Kuningasten kirja',
    '1 Kun': '1. Kuningasten kirja',
    '2.Kun': '2. Kuningasten kirja',
    '2. Kun': '2. Kuningasten kirja',
    '2 Kun': '2. Kuningasten kirja',
    'Ps': 'Psalmien kirja',
    'Ps.': 'Psalmien kirja',
    'Sananl': 'Sananlaskujen kirja',
    'Sananl.': 'Sananlaskujen kirja',
    'Jes': 'Jesajan kirja',
    'Jes.': 'Jesajan kirja',
    'Room': 'Kirje roomalaisille',
    'Room.': 'Kirje roomalaisille',
    '1.Kor': '1. Kor',
    '1. Kor': '1. Kor',
    '1 Kor': '1. Kor',
    '2.Kor': '2. Kor',
    '2. Kor': '2. Kor',
    '2 Kor': '2. Kor',
    'Gal': 'Kirje galatalaisille',
    'Gal.': 'Kirje galatalaisille',
    'Ef': 'Kirje efesolaisille',
    'Ef.': 'Kirje efesolaisille',
    'Fil': 'Kirje filippiläisille',
    'Fil.': 'Kirje filippiläisille',
    '1.Tess': '1. Tess',
    '1. Tess': '1. Tess',
    '1 Tess': '1. Tess',
    '2.Tess': '2. Tess',
    '2. Tess': '2. Tess',
    '2 Tess': '2. Tess',
    '1.Tim': '1. Tim',
    '1. Tim': '1. Tim',
    '1 Tim': '1. Tim',
    '2.Tim': '2. Tim',
    '2. Tim': '2. Tim',
    '2 Tim': '2. Tim',
    'Hepr': 'Kirje heprealaisille',
    'Hepr.': 'Kirje heprealaisille',
    'Jaak': 'Jaakobin kirje',
    'Jaak.': 'Jaakobin kirje',
    '1.Piet': '1. Pietarin kirje',
    '1. Piet': '1. Pietarin kirje',
    '1 Piet': '1. Pietarin kirje',
    '2.Piet': '2. Pietarin kirje',
    '2. Piet': '2. Pietarin kirje',
    '2 Piet': '2. Pietarin kirje',
    '1.Joh': '1. Johanneksen kirje',
    '1. Joh': '1. Johanneksen kirje',
    '1 Joh': '1. Johanneksen kirje',
    '2.Joh': '2. Johanneksen kirje',
    '2. Joh': '2. Johanneksen kirje',
    '2 Joh': '2. Johanneksen kirje',
    '3.Joh': '3. Johanneksen kirje',
    '3. Joh': '3. Johanneksen kirje',
    '3 Joh': '3. Johanneksen kirje',
    'Ilm': 'Johanneksen ilmestys',
    'Ilm.': 'Johanneksen ilmestys',
    
    // English abbreviations
    'John': 'Johannes',
    '1 John': '1. Johanneksen kirje',
    '2 John': '2. Johanneksen kirje',
    '3 John': '3. Johanneksen kirje',
    'Matthew': 'Matteus',
    'Luke': 'Luukas',
    'Gen': '1. Mooseksen kirja',
    'Gen.': '1. Mooseksen kirja',
    'Genesis': '1. Mooseksen kirja',
    'Exod': '2. Mooseksen kirja',
    'Exod.': '2. Mooseksen kirja',
    'Exodus': '2. Mooseksen kirja',
    'Lev': '3. Mooseksen kirja',
    'Lev.': '3. Mooseksen kirja',
    'Leviticus': '3. Mooseksen kirja',
    'Num': '4. Mooseksen kirja',
    'Num.': '4. Mooseksen kirja',
    'Numbers': '4. Mooseksen kirja',
    'Deut': '5. Mooseksen kirja',
    'Deut.': '5. Mooseksen kirja',
    'Deuteronomy': '5. Mooseksen kirja',
    'Rom': 'Kirje roomalaisille',
    'Rom.': 'Kirje roomalaisille',
    'Romans': 'Kirje roomalaisille',
    'Gal': 'Kirje galatalaisille',
    'Galatians': 'Kirje galatalaisille',
    'Eph': 'Kirje efesolaisille',
    'Eph.': 'Kirje efesolaisille',
    'Ephesians': 'Kirje efesolaisille',
    'Phil': 'Kirje filippiläisille',
    'Phil.': 'Kirje filippiläisille',
    'Philippians': 'Kirje filippiläisille',
    'Rev': 'Johanneksen ilmestys',
    'Rev.': 'Johanneksen ilmestys',
    'Revelation': 'Johanneksen ilmestys'
  };

  // Try to match pattern: "Book Chapter:Verse" or "Book Chapter.Verse" or "Book Chapter:Verse-Verse"
  // Support both : and . as separators, and optional spaces around -
  // Use .+? to allow numbers in book names (e.g., "3. Joh", "3 Joh", "1. Moos")
  const match = ref.match(/^(.+?)\s*(\d+)[.:](\d+)(?:\s*-\s*(\d+))?$/);
  
  if (!match) {
    return null;
  }

  let book = match[1].trim();
  const chapter = parseInt(match[2]);
  const startVerse = parseInt(match[3]);
  const endVerse = match[4] ? parseInt(match[4]) : undefined;

  // Replace abbreviation with full name if found
  if (abbreviations[book]) {
    book = abbreviations[book];
  }

  return { book, chapter, startVerse, endVerse };
}
