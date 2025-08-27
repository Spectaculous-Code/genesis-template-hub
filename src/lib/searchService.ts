import { supabase } from "@/integrations/supabase/client";

export interface SearchResult {
  type: 'reference' | 'text';
  verses?: {
    id: string;
    text: string;
    verse_number: number;
    chapter_number: number;
    book_name: string;
    book_id: string;
    chapter_id: string;
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
        book: normalizeBookName(bookPart),
        chapter,
        verses
      };
    }
  }

  return null;
}

// Normalize book names to match database
function normalizeBookName(bookPart: string): string {
  const bookMappings: Record<string, string> = {
    // Finnish/German abbreviations to English book names
    '1joh': 'I John',
    '2joh': 'II John', 
    '3joh': 'III John',
    'joh': 'John',
    'johannes': 'John',
    '1johannes': 'I John',
    '2johannes': 'II John',
    '3johannes': 'III John',
    '1moos': 'Genesis',
    '2moos': 'Exodus',
    '3moos': 'Leviticus',
    '4moos': 'Numbers',
    '5moos': 'Deuteronomy',
    'matt': 'Matthew',
    'matteus': 'Matthew',
    'mark': 'Mark',
    'markus': 'Mark',
    'luuk': 'Luke',
    'luukas': 'Luke',
    'apt': 'Acts',
    'apostolienteot': 'Acts',
    'room': 'Romans',
    'roomalaiset': 'Romans',
    '1kor': 'I Corinthians',
    '2kor': 'II Corinthians',
    '1korinttilaiset': 'I Corinthians',
    '2korinttilaiset': 'II Corinthians',
    'gal': 'Galatians',
    'galatalaiset': 'Galatians',
    'ef': 'Ephesians',
    'efesolaiset': 'Ephesians',
    'fil': 'Philippians',
    'filippiläiset': 'Philippians',
    'kol': 'Colossians',
    'kolossalaiset': 'Colossians',
    '1tess': 'I Thessalonians',
    '2tess': 'II Thessalonians',
    '1tessalonikalaiset': 'I Thessalonians',
    '2tessalonikalaiset': 'II Thessalonians',
    '1tim': 'I Timothy',
    '2tim': 'II Timothy',
    '1timoteus': 'I Timothy',
    '2timoteus': 'II Timothy',
    'tit': 'Titus',
    'titus': 'Titus',
    'filem': 'Philemon',
    'filemon': 'Philemon',
    'hebr': 'Hebrews',
    'heprealaiset': 'Hebrews',
    'jaak': 'James',
    'jaakob': 'James',
    '1piet': 'I Peter',
    '2piet': 'II Peter',
    '1pietari': 'I Peter',
    '2pietari': 'II Peter',
    'juud': 'Jude',
    'juuda': 'Jude',
    'ilm': 'Revelation of John',
    'ilmestys': 'Revelation of John'
  };

  const normalized = bookPart.toLowerCase().replace(/\s/g, '');
  return bookMappings[normalized] || bookPart;
}

// Search for Bible references
export async function searchReference(reference: SearchResult['reference'], versionId?: string): Promise<SearchResult> {
  if (!reference) {
    return { type: 'reference', verses: [] };
  }

  try {
    let query = (supabase as any)
      .from('verses')
      .select(`
        id,
        text,
        verse_number,
        chapters!inner(
          chapter_number,
          books!inner(
            name,
            id
          ),
          id
        )
      `)
      .eq('chapters.books.name', reference.book)
      .eq('chapters.chapter_number', reference.chapter);

    // Filter by version if provided
    if (versionId) {
      query = query.eq('version_id', versionId);
    }

    if (reference.verses && reference.verses.length > 0) {
      query = query.in('verse_number', reference.verses);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Reference search error:', error);
      return { type: 'reference', verses: [] };
    }

    const verses = data?.map((verse: any) => ({
      id: verse.id,
      text: verse.text,
      verse_number: verse.verse_number,
      chapter_number: verse.chapters.chapter_number,
      book_name: verse.chapters.books.name,
      book_id: verse.chapters.books.id,
      chapter_id: verse.chapters.id
    })) || [];

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

// Search for text using full-text search
export async function searchText(searchTerm: string, versionId?: string): Promise<SearchResult> {
  if (!searchTerm.trim()) {
    return { type: 'text', verses: [] };
  }

  try {
    let query = (supabase as any)
      .from('verses')
      .select(`
        id,
        text,
        verse_number,
        chapters!inner(
          chapter_number,
          books!inner(
            name,
            id
          ),
          id
        )
      `)
      .textSearch('text_search', searchTerm, { type: 'websearch' })
      .limit(50);

    // Filter by version if provided
    if (versionId) {
      query = query.eq('version_id', versionId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Text search error:', error);
      return { type: 'text', verses: [] };
    }

    const verses = data?.map((verse: any) => ({
      id: verse.id,
      text: verse.text,
      verse_number: verse.verse_number,
      chapter_number: verse.chapters.chapter_number,
      book_name: verse.chapters.books.name,
      book_id: verse.chapters.books.id,
      chapter_id: verse.chapters.id
    })) || [];

    return {
      type: 'text',
      verses
    };
  } catch (error) {
    console.error('Text search error:', error);
    return { type: 'text', verses: [] };
  }
}

// Main search function that determines search type
export async function performSearch(query: string, versionId?: string): Promise<SearchResult> {
  if (!query.trim()) {
    return { type: 'text', verses: [] };
  }

  // Try to parse as Bible reference first
  const reference = parseBibleReference(query);
  if (reference) {
    return await searchReference(reference, versionId);
  }

  // Otherwise, perform text search
  return await searchText(query, versionId);
}
