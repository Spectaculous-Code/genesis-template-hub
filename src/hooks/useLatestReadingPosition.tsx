import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface LatestReadingPosition {
  bookName: string;
  chapter: number;
  verse?: number;
}

export const useLatestReadingPosition = () => {
  const { user } = useAuth();
  const [latestPosition, setLatestPosition] = useState<LatestReadingPosition | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchLatestPosition();
    } else {
      setLatestPosition(null);
    }
  }, [user]);

  const fetchLatestPosition = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .schema('bible_schema')
        .from('user_reading_history')
        .select('chapter_number, verse_number, book_id')
        .eq('user_id', user.id)
        .order('last_read_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching latest reading position:', error);
      } else if (data) {
        // Fetch book name separately from bible_schema
        const { data: bookData } = await (supabase as any)
          .schema('bible_schema')
          .from('books')
          .select('name')
          .eq('id', data.book_id)
          .single();
        
        if (bookData) {
          setLatestPosition({
            bookName: bookData.name,
            chapter: data.chapter_number,
            verse: data.verse_number,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching latest reading position:', error);
    } finally {
      setLoading(false);
    }
  };

  return { latestPosition, loading, refetch: fetchLatestPosition };
};