import { supabase } from "@/integrations/supabase/client";

export interface LexiconDefinition {
  strongs_number: string;
  definition_short: string | null;
  definition_long: string | null;
  lemma: string | null;
  transliterations: string[] | null;
  pronunciations: string[] | null;
  part_of_speech: string | null;
  language: string;
}

export const getLexiconDefinition = async (strongsNumber: string): Promise<LexiconDefinition | null> => {
  const { data: lexiconData, error: lexiconError } = await (supabase as any)
    .schema('bible_schema')
    .from('strongs_lexicon')
    .select('*')
    .eq('strongs_number', strongsNumber)
    .maybeSingle();

  if (lexiconError) {
    console.error('Error fetching lexicon definition:', lexiconError);
    return null;
  }

  return lexiconData;
};

export interface StrongsSearchResult {
  verses: Array<{
    id: string;
    book_name: string;
    chapter_number: number;
    verse_number: number;
    text: string;
    version_code: string;
    book_id: string;
    chapter_id: string;
  }>;
  total_count: number;
  search_term: string;
}

export const searchByStrongsNumber = async (strongsNumber: string, targetVersionCode?: string): Promise<StrongsSearchResult> => {
  try {
    console.log('Searching for Strong\'s number:', strongsNumber);
    console.log('Target version:', targetVersionCode);

    // Clean the Strong's number (remove G/H prefix if present for search)
    const cleanNumber = strongsNumber.replace(/^[GH]/, '');
    console.log('Cleaned Strong\'s number:', cleanNumber);

    // Try different search patterns
    const searchPatterns = [
      strongsNumber,           // G3588
      cleanNumber,             // 3588
      `G${cleanNumber}`,       // G3588
      `H${cleanNumber}`,       // H3588 (for Hebrew)
      strongsNumber.padStart(5, '0'), // 03588
      `G${cleanNumber.padStart(4, '0')}`, // G3588
      `H${cleanNumber.padStart(5, '0')}`  // H08416
    ];

    console.log('Trying search patterns:', searchPatterns);

    let kjvVerses = null;

    // First, find the KJV verses that contain this Strong's number
    for (const pattern of searchPatterns) {
      console.log('Trying pattern:', pattern);
      
      const { data: strongsWords, error: strongsError } = await (supabase as any)
        .schema('bible_schema')
        .from('kjv_strongs_words')
        .select(`
          verse_id,
          strongs_number,
          word_text,
          verses!inner(
            id,
            verse_key_id,
            text,
            chapter_id,
            version_id,
            verse_number,
            chapters!inner(
              id,
              chapter_number,
              book_id,
              books!inner(
                id,
                name
              )
            ),
            bible_versions!inner(
              code
            ),
            verse_keys!inner(
              osis
            )
          )
        `)
        .eq('strongs_number', pattern);

      if (strongsError) {
        console.error(`Error with pattern ${pattern}:`, strongsError);
        continue;
      }

      console.log(`Found ${strongsWords?.length || 0} results with pattern:`, pattern);
      
      if (strongsWords && strongsWords.length > 0) {
        kjvVerses = strongsWords;
        console.log('Success with pattern:', pattern);
        break;
      }
    }

    if (!kjvVerses) {
      console.log('No KJV verses found with Strong\'s number');
      return {
        verses: [],
        total_count: 0,
        search_term: strongsNumber
      };
    }

    // If no target version specified, return KJV results
    if (!targetVersionCode || targetVersionCode === 'KJV') {
      const verses = kjvVerses.map(item => ({
        id: item.verses.id,
        book_name: item.verses.chapters.books.name,
        chapter_number: item.verses.chapters.chapter_number,
        verse_number: item.verses.verse_number,
        text: item.verses.text,
        version_code: item.verses.bible_versions.code,
        book_id: item.verses.chapters.books.id,
        chapter_id: item.verses.chapters.id
      }));

      const uniqueVerses = verses.filter((verse, index, self) => 
        index === self.findIndex(v => v.id === verse.id)
      );

      return {
        verses: uniqueVerses,
        total_count: uniqueVerses.length,
        search_term: strongsNumber
      };
    }

    // Get the OSIS references from the KJV verses
    const osisReferences = kjvVerses.map(item => item.verses.verse_keys.osis).filter((osis): osis is string => osis != null);
    const uniqueOsis = [...new Set(osisReferences)];
    
    console.log('Found OSIS references:', uniqueOsis);
    console.log('Target version code for search:', targetVersionCode);

    // Now find verses in the target version using these OSIS references
    const { data: targetVerses, error: targetError } = await (supabase as any)
      .schema('bible_schema')
      .from('verses')
      .select(`
        id,
        text,
        verse_number,
        chapter_id,
        version_id,
        verse_keys!inner(
          osis
        ),
        chapters!inner(
          id,
          chapter_number,
          book_id,
          books!inner(
            id,
            name
          )
        ),
        bible_versions!inner(
          code
        )
      `)
      .eq('bible_versions.code', targetVersionCode)
      .in('verse_keys.osis', uniqueOsis as string[])
      .eq('is_superseded', false);

    console.log('Target version query result:', { data: targetVerses, error: targetError });
    console.log(`Found ${targetVerses?.length || 0} verses in target version`);

    if (targetError) {
      console.error('Error fetching target version verses:', targetError);
      // Fallback to KJV if target version fails
      const verses = kjvVerses.map(item => ({
        id: item.verses.id,
        book_name: item.verses.chapters.books.name,
        chapter_number: item.verses.chapters.chapter_number,
        verse_number: item.verses.verse_number,
        text: item.verses.text,
        version_code: item.verses.bible_versions.code,
        book_id: item.verses.chapters.books.id,
        chapter_id: item.verses.chapters.id
      }));

      const uniqueVerses = verses.filter((verse, index, self) => 
        index === self.findIndex(v => v.id === verse.id)
      );

      return {
        verses: uniqueVerses,
        total_count: uniqueVerses.length,
        search_term: strongsNumber
      };
    }

    if (!targetVerses || targetVerses.length === 0) {
      console.log('No verses found in target version, falling back to KJV');
      // Fallback to KJV if no verses found in target version
      const verses = kjvVerses.map(item => ({
        id: item.verses.id,
        book_name: item.verses.chapters.books.name,
        chapter_number: item.verses.chapters.chapter_number,
        verse_number: item.verses.verse_number,
        text: item.verses.text,
        version_code: item.verses.bible_versions.code,
        book_id: item.verses.chapters.books.id,
        chapter_id: item.verses.chapters.id
      }));

      const uniqueVerses = verses.filter((verse, index, self) => 
        index === self.findIndex(v => v.id === verse.id)
      );

      return {
        verses: uniqueVerses,
        total_count: uniqueVerses.length,
        search_term: strongsNumber
      };
    }

    console.log(`Found ${targetVerses.length} verses in target version ${targetVersionCode}`);

    // Transform target version verses to expected format
    const verses = targetVerses.map((verse: any) => ({
      id: verse.id,
      book_name: verse.chapters.books.name,
      chapter_number: verse.chapters.chapter_number,
      verse_number: verse.verse_number,
      text: verse.text,
      version_code: verse.bible_versions.code,
      book_id: verse.chapters.books.id,
      chapter_id: verse.chapters.id
    }));

    return {
      verses: verses,
      total_count: verses.length,
      search_term: strongsNumber
    };

  } catch (error) {
    console.error('Error in Strong\'s search:', error);
    return {
      verses: [],
      total_count: 0,
      search_term: strongsNumber
    };
  }
};