import { supabase } from "@/integrations/supabase/client";

export interface SearchResult {
  type: 'reference' | 'text';
  verses?: {
    verse_id: string;
    text_content: string;
    verse_number: number;
    chapter_number: number;
    book_name: string;
    osis: string;
  }[];
  reference?: {
    book: string;
    chapter: number;
    verses?: number[];
  };
}

// Parse Bible references like "1.Joh.1:2-5", "1Joh 2-5", "1 Johannes. 2-5"
export function parseBibleReference(query: string): SearchResult['reference'] | null {
  // Clean the query
  const cleaned = query.trim().replace(/\s+/g, ' ');
  
  // Pattern for Bible references
  const patterns = [
    // "1.Joh.1:2-5" or "1 Joh. 1:2-5" or "1 Johannes. 1:2-5"
    /^(\d*\.?\s*[\w\s]+\.?)\s*(\d+):(\d+)(?:-(\d+))?$/i,
    // "1Joh 2-5" or "Joh 2-5" or "1 Johannes 2-5"
    /^(\d*\.?\s*[\w\s]+\.?)\s*(\d+)(?:-(\d+))?$/i,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      const bookPart = match[1].replace(/\./g, '').trim();
      const chapter = parseInt(match[2]);
      
      let verses: number[] | undefined;
      if (match[3] && match[4]) {
        // Range like 2-5
        const start = parseInt(match[3]);
        const end = parseInt(match[4]);
        verses = Array.from({ length: end - start + 1 }, (_, i) => start + i);
      } else if (match[3]) {
        // Single verse
        verses = [parseInt(match[3])];
      }

      return {
        book: bookPart, // Let DB function handle normalization
        chapter,
        verses
      };
    }
  }

  return null;
}

// Removed - book normalization is now handled by DB functions

// Search for Bible references using RPC function
export async function searchReference(reference: SearchResult['reference'], versionCode?: string): Promise<SearchResult> {
  if (!reference) {
    return { type: 'reference', verses: [] };
  }

  try {
    const { data, error } = await (supabase.rpc as any)('get_verses_by_ref', {
      p_ref_book: reference.book,
      p_chapter: reference.chapter,
      p_verses: reference.verses || null, // null = return all verses of chapter
      p_version_code: versionCode || 'finstlk201',
      p_language_code: 'fi'
    });

    if (error) {
      console.error('Reference search error:', error);
      return { type: 'reference', verses: [] };
    }

    const verses = (data || []).map((verse: any) => ({
      verse_id: verse.verse_id,
      text_content: verse.text_content,
      verse_number: verse.verse_number,
      chapter_number: verse.chapter_number,
      book_name: verse.book_name,
      osis: verse.osis
    }));

    return {
      type: 'reference',
      verses,
      reference
    };
  } catch (error) {
    console.error('Reference search error:', error);
    return { type: 'reference', verses: [] };
  }
}

// Search for text using RPC function (full-text search)
export async function searchText(searchTerm: string, versionCode?: string): Promise<SearchResult> {
  if (!searchTerm.trim()) {
    return { type: 'text', verses: [] };
  }

  try {
    const { data, error } = await (supabase.rpc as any)('search_text', {
      p_query: searchTerm,
      p_version_code: versionCode || 'finstlk201',
      p_limit: 50
    });

    if (error) {
      console.error('Text search error:', error);
      return { type: 'text', verses: [] };
    }

    const verses = (data || []).map((verse: any) => ({
      verse_id: verse.verse_id,
      text_content: verse.text_content,
      verse_number: verse.verse_number,
      chapter_number: verse.chapter_number,
      book_name: verse.book_name,
      osis: verse.osis
    }));

    return {
      type: 'text',
      verses
    };
  } catch (error) {
    console.error('Text search error:', error);
    return { type: 'text', verses: [] };
  }
}

// Extended search using ILIKE for compound words (e.g., "yhdeksän" finds "yhdeksänsataa")
export async function searchTextExtended(searchTerm: string, versionCode?: string): Promise<SearchResult> {
  if (!searchTerm.trim()) {
    return { type: 'text', verses: [] };
  }

  try {
    // Using direct query with ILIKE to find partial matches including compound words
    const { data, error } = await supabase.schema('bible_schema')
      .from('verses')
      .select(`
        id,
        text,
        verse_number,
        chapter:chapters!inner(
          chapter_number,
          book:books!inner(
            name
          )
        ),
        verse_key:verse_keys(osis),
        version:bible_versions!inner(code)
      `)
      .ilike('text', `%${searchTerm}%`)
      .eq('bible_versions.code', versionCode || 'finstlk201')
      .eq('is_superseded', false)
      .limit(100);

    if (error) {
      console.error('Extended text search error:', error);
      return { type: 'text', verses: [] };
    }

    const verses = (data || []).map((verse: any) => ({
      verse_id: verse.id,
      text_content: verse.text,
      verse_number: verse.verse_number,
      chapter_number: verse.chapter?.chapter_number,
      book_name: verse.chapter?.book?.name,
      osis: verse.verse_key?.osis || ''
    }));

    return {
      type: 'text',
      verses
    };
  } catch (error) {
    console.error('Extended text search error:', error);
    return { type: 'text', verses: [] };
  }
}

// Main search function that determines search type
export async function performSearch(query: string, versionCode?: string): Promise<SearchResult> {
  if (!query.trim()) {
    return { type: 'text', verses: [] };
  }

  // Try to parse as Bible reference first
  const reference = parseBibleReference(query);
  if (reference) {
    return await searchReference(reference, versionCode);
  }

  // Otherwise, perform text search
  return await searchText(query, versionCode);
}
