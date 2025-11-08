import { supabase } from "@/integrations/supabase/client";

export interface AudioCue {
  verse_id: string;
  verse_number: number;
  start_ms: number;
  end_ms: number;
}

export interface AudioGenerationResult {
  audio_id: string;
  file_url: string;
  duration_ms: number;
  audio_cues?: AudioCue[];
  from_cache?: boolean;
}

/**
 * Generate or fetch audio for a specific chapter
 * @param bookName - Name of the Bible book
 * @param chapterNumber - Chapter number
 * @param versionCode - Bible version code (default: 'finstlk201')
 * @param readerKey - Voice reader key in format "elevenlabs:voice_id" (default: "elevenlabs:9BWtsMINqrJLrRacOk9x" - Aria)
 */
export const generateChapterAudio = async (
  bookName: string,
  chapterNumber: number,
  versionCode: string = 'finstlk201',
  readerKey: string = 'elevenlabs:9BWtsMINqrJLrRacOk9x' // Default to Aria voice
): Promise<AudioGenerationResult> => {
  try {
    // Validate inputs
    if (!bookName || bookName.trim() === '') {
      throw new Error('Book name is required');
    }
    if (!chapterNumber || chapterNumber < 1) {
      throw new Error('Valid chapter number is required');
    }
    if (!versionCode || versionCode.trim() === '') {
      throw new Error('Version code is required');
    }

    console.log('Generating audio for:', { bookName, chapterNumber, versionCode, readerKey });

    // Get version_id
    const { data: versionData, error: versionError } = await (supabase as any)
      .schema('bible_schema')
      .from('bible_versions')
      .select('id')
      .eq('code', versionCode)
      .single();

    if (versionError || !versionData) {
      throw new Error(`Version not found: ${versionCode}`);
    }

    const versionId = versionData.id;

    // Get book_id
    const { data: bookData, error: bookError } = await (supabase as any)
      .schema('bible_schema')
      .from('books')
      .select('id')
      .eq('name', bookName)
      .eq('version_id', versionId)
      .single();

    if (bookError || !bookData) {
      throw new Error(`Book not found: ${bookName}`);
    }

    const bookId = bookData.id;

    // Get chapter_id
    const { data: chapterData, error: chapterError } = await (supabase as any)
      .schema('bible_schema')
      .from('chapters')
      .select('id')
      .eq('book_id', bookId)
      .eq('chapter_number', chapterNumber)
      .single();

    if (chapterError || !chapterData) {
      throw new Error(`Chapter not found: ${bookName} ${chapterNumber}`);
    }

    const chapterId = chapterData.id;

    console.log('Calling generate-audio with:', { chapterId, versionId, readerKey });

    // Call edge function to generate or fetch audio
    const { data, error } = await supabase.functions.invoke('generate-audio', {
      body: {
        chapter_id: chapterId,
        version_id: versionId,
        reader_key: readerKey
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(`Audio generation failed: ${error.message}`);
    }

    if (!data || !data.file_url) {
      throw new Error('No audio URL returned from server');
    }

    console.log('Audio loaded successfully:', data);

    // Fetch audio cues for this audio
    const { data: cuesData, error: cuesError } = await supabase
      .from('audio_cues')
      .select('verse_id, start_ms, end_ms')
      .eq('audio_id', data.audio_id)
      .order('start_ms', { ascending: true });

    if (cuesError) {
      console.error('Error fetching audio cues:', cuesError);
    }

    // Fetch verse numbers for all cues in a single query
    const verseIds = (cuesData || []).map((cue: any) => cue.verse_id);
    let verseNumbersMap: Record<string, number> = {};
    
    if (verseIds.length > 0) {
      const { data: versesData, error: versesError } = await (supabase as any)
        .schema('bible_schema')
        .from('verses')
        .select('id, verse_number')
        .in('id', verseIds);
      
      if (versesError) {
        console.error('Error fetching verse numbers:', versesError);
      } else if (versesData) {
        verseNumbersMap = versesData.reduce((acc: Record<string, number>, verse: any) => {
          acc[verse.id] = verse.verse_number;
          return acc;
        }, {});
      }
    }

    // Map cues to include verse_number
    const mappedCues = (cuesData || []).map((cue: any) => ({
      verse_id: cue.verse_id,
      verse_number: verseNumbersMap[cue.verse_id] || 0,
      start_ms: cue.start_ms,
      end_ms: cue.end_ms
    }));

    return {
      audio_id: data.audio_id,
      file_url: data.file_url,
      duration_ms: data.duration_ms,
      audio_cues: mappedCues,
      from_cache: data.from_cache
    };
  } catch (error) {
    console.error('Error in generateChapterAudio:', error);
    throw error;
  }
};

/**
 * Check if audio exists for a chapter without generating it
 */
export const checkAudioExists = async (
  bookName: string,
  chapterNumber: number,
  versionCode: string = 'finstlk201',
  readerKey: string = 'elevenlabs:9BWtsMINqrJLrRacOk9x'
): Promise<string | null> => {
  try {
    // Generate hash to check if audio already exists
    const hashInput = `${bookName}${chapterNumber}${versionCode}${readerKey}`;
    
    // For now, we'll just return null and let the generation function handle checking
    // This is a placeholder for future optimization
    return null;
  } catch (error) {
    console.error('Error checking audio existence:', error);
    return null;
  }
};
