import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface RecentSearch {
  id: string;
  search_query: string;
  search_type: 'reference' | 'text';
  version_code: string;
  created_at: string;
}

export const useRecentSearches = () => {
  const { user } = useAuth();
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecentSearches = async () => {
    if (!user) {
      setRecentSearches([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Remove duplicates - keep only the most recent occurrence of each search_query
      const uniqueSearches = data?.reduce((acc: RecentSearch[], current) => {
        if (!acc.find(item => item.search_query === current.search_query)) {
          acc.push(current as RecentSearch);
        }
        return acc;
      }, []) || [];

      setRecentSearches(uniqueSearches);
    } catch (error) {
      console.error('Error loading recent searches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecentSearches();
  }, [user]);

  return { recentSearches, loading, refreshRecentSearches: loadRecentSearches };
};

