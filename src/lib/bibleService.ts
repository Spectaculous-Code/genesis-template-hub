import { supabase } from "@/integrations/supabase/client";

export interface BibleBook {
  id: string;
  name: string;
  name_localized: string;
  testament: string;
  chapters_count: number;
  book_order: number;
}

export interface BibleChapter {
  id: string;
  chapter_number: number;
  verses_count: number;
  book_id: string;
}

export interface BibleVerse {
  id: string;
  verse_number: number;
  text: string;
  audio_url?: string;
}

export interface BibleVersion {
  id: string;
  code: string;
  name: string;
  language: string;
}

export interface ChapterWithVerses {
  book: string;
  chapter: number;
  verses: BibleVerse[];
}

// Get all Bible versions
export const getBibleVersions = async (): Promise<BibleVersion[]> => {
  try {
    const response: any = await (supabase as any)
      .schema('bible_schema')
      .from('bible_versions')
      .select('*')
      .eq('is_active', true)
      .order('code');

    if (response.error) {
      console.error('Error fetching Bible versions:', response.error);
      return [];
    }

    return response.data || [];
  } catch (error) {
    console.error('Error in getBibleVersions:', error);
    return [];
  }
};

// Get all books for the default version
export const getBibleBooks = async (versionCode: string = 'finstlk201'): Promise<BibleBook[]> => {
  try {
    console.log('Fetching books for version:', versionCode);
    
    // Create a simple untyped supabase call
    const supabaseQuery = (supabase as any);
    
    // First get the version
    const versionResponse = await supabaseQuery
      .schema('bible_schema')
      .from('bible_versions')
      .select('id')
      .eq('code', versionCode)
      .single();

    if (versionResponse.error || !versionResponse.data) {
      console.error('Error fetching version:', versionResponse.error);
      return [];
    }

    console.log('Version found:', versionResponse.data);

    // Get books for this specific version
    const booksResponse = await supabaseQuery
      .schema('bible_schema')
      .from('books')
      .select('id, name, name_localized, testament, chapters_count, book_order')
      .eq('version_id', versionResponse.data.id)
      .order('book_order');

    if (booksResponse.error) {
      console.error('Error fetching books:', booksResponse.error);
      return [];
    }

    if (!booksResponse.data) {
      console.log('No books data returned');
      return [];
    }
    
    console.log('Books found:', booksResponse.data.length);
    
    // Log all book names for debugging
    console.log('Available book names:', booksResponse.data.map((b: any) => `${b.name} / ${b.name_localized}`));
    
    // Map to our interface
    const books: BibleBook[] = booksResponse.data.map((book: any) => ({
      id: book.id,
      name: book.name,
      name_localized: book.name_localized || book.name,
      testament: book.testament,
      chapters_count: book.chapters_count,
      book_order: book.book_order
    }));
    
    // Sort books: New Testament first, then Old Testament
    return books.sort((a, b) => {
      if (a.testament === 'new' && b.testament === 'old') return -1;
      if (a.testament === 'old' && b.testament === 'new') return 1;
      return a.book_order - b.book_order;
    });
  } catch (error) {
    console.error('Error in getBibleBooks:', error);
    return [];
  }
};

// Get chapter with verses using optimized RPC function
export const getChapterData = async (bookName: string, chapterNumber: number, versionCode: string = 'finstlk201'): Promise<ChapterWithVerses | null> => {
  try {
    console.log('Fetching chapter data:', { bookName, chapterNumber, versionCode });

    const { data, error } = await (supabase as any).rpc('get_chapter_by_ref', {
      p_ref_book: bookName,
      p_chapter: chapterNumber,
      p_version_code: versionCode === 'finstlk201' ? null : versionCode,
      p_language_code: 'fi'
    });

    if (error) {
      console.error('Error fetching chapter:', error);
      return null;
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('No chapter data found');
      return null;
    }

    console.log('Chapter data fetched:', data.length, 'verses');

    // Transform the RPC response to our interface
    const verses: BibleVerse[] = data.map((row: any) => ({
      id: row.verse_id,
      verse_number: row.verse_number,
      text: row.text_content,
      audio_url: undefined // Not provided by RPC function
    }));

    return {
      book: bookName,
      chapter: chapterNumber,
      verses
    };
  } catch (error) {
    console.error('Error in getChapterData:', error);
    return null;
  }
};

// Get chapters for a book
export const getBookChapters = async (bookName: string, versionCode: string = 'finstlk201'): Promise<number> => {
  try {
    const supabaseQuery = (supabase as any);
    
    // First get the version
    const versionResponse = await supabaseQuery
      .schema('bible_schema')
      .from('bible_versions')
      .select('id')
      .eq('code', versionCode)
      .single();

    if (versionResponse.error || !versionResponse.data) {
      console.error('Error fetching version:', versionResponse.error);
      return 0;
    }

    const bookResponse = await supabaseQuery
      .schema('bible_schema')
      .from('books')
      .select('chapters_count')
      .eq('name', bookName)
      .eq('version_id', versionResponse.data.id)
      .single();

    if (bookResponse.error) {
      console.error('Error fetching book chapters:', bookResponse.error);
      return 0;
    }

    return bookResponse.data?.chapters_count || 0;
  } catch (error) {
    console.error('Error in getBookChapters:', error);
    return 0;
  }
};

// Get next chapter data (book and chapter number)
export const getNextChapter = async (currentBookName: string, currentChapter: number, versionCode: string = 'finstlk201'): Promise<{book: string, chapter: number} | null> => {
  try {
    const supabaseQuery = (supabase as any);
    
    // First get the version
    const versionResponse = await supabaseQuery
      .schema('bible_schema')
      .from('bible_versions')
      .select('id')
      .eq('code', versionCode)
      .single();

    if (versionResponse.error || !versionResponse.data) {
      console.error('Error fetching version:', versionResponse.error);
      return null;
    }

    // First get the current book
    const currentBookResponse = await supabaseQuery
      .schema('bible_schema')
      .from('books')
      .select('id, chapters_count, book_order')
      .eq('name', currentBookName)
      .eq('version_id', versionResponse.data.id)
      .single();

    if (currentBookResponse.error || !currentBookResponse.data) {
      console.error('Error fetching current book:', currentBookResponse.error);
      return null;
    }

    // If there's a next chapter in the same book
    if (currentChapter < currentBookResponse.data.chapters_count) {
      return {
        book: currentBookName,
        chapter: currentChapter + 1
      };
    }

    // Otherwise, get the next book
    const nextBookResponse = await supabaseQuery
      .schema('bible_schema')
      .from('books')
      .select('name, chapters_count')
      .eq('version_id', versionResponse.data.id)
      .gt('book_order', currentBookResponse.data.book_order)
      .order('book_order')
      .limit(1)
      .single();

    if (nextBookResponse.error || !nextBookResponse.data) {
      // No next book available
      return null;
    }

    return {
      book: nextBookResponse.data.name,
      chapter: 1
    };
  } catch (error) {
    console.error('Error in getNextChapter:', error);
    return null;
  }
};

// Get previous chapter data (book and chapter number)
export const getPreviousChapter = async (currentBookName: string, currentChapter: number, versionCode: string = 'finstlk201'): Promise<{book: string, chapter: number} | null> => {
  try {
    const supabaseQuery = (supabase as any);
    
    // First get the version
    const versionResponse = await supabaseQuery
      .schema('bible_schema')
      .from('bible_versions')
      .select('id')
      .eq('code', versionCode)
      .single();

    if (versionResponse.error || !versionResponse.data) {
      console.error('Error fetching version:', versionResponse.error);
      return null;
    }

    // First get the current book
    const currentBookResponse = await supabaseQuery
      .schema('bible_schema')
      .from('books')
      .select('id, chapters_count, book_order')
      .eq('name', currentBookName)
      .eq('version_id', versionResponse.data.id)
      .single();

    if (currentBookResponse.error || !currentBookResponse.data) {
      console.error('Error fetching current book:', currentBookResponse.error);
      return null;
    }

    // If there's a previous chapter in the same book
    if (currentChapter > 1) {
      return {
        book: currentBookName,
        chapter: currentChapter - 1
      };
    }

    // Otherwise, get the previous book
    const prevBookResponse = await supabaseQuery
      .schema('bible_schema')
      .from('books')
      .select('name, chapters_count')
      .eq('version_id', versionResponse.data.id)
      .lt('book_order', currentBookResponse.data.book_order)
      .order('book_order', { ascending: false })
      .limit(1)
      .single();

    if (prevBookResponse.error || !prevBookResponse.data) {
      // No previous book available
      return null;
    }

    return {
      book: prevBookResponse.data.name,
      chapter: prevBookResponse.data.chapters_count
    };
  } catch (error) {
    console.error('Error in getPreviousChapter:', error);
    return null;
  }
};
