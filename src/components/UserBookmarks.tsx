import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, BookOpen, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { getFinnishBookName } from '@/lib/bookNameMapping';

interface BookmarkItem {
  id: string;
  created_at: string;
  verse: {
    verse_number: number;
    chapter: {
      chapter_number: number;
      book: {
        name: string;
        name_localized?: string;
      };
    };
    version: {
      code: string;
      name: string;
    };
  };
}

const UserBookmarks = () => {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBookmarks();
    }
  }, [user]);

  const fetchBookmarks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select(`
          id,
          created_at,
          verse:verse_id (
            verse_number,
            chapter:chapter_id (
              chapter_number,
              book:book_id (
                name,
                name_localized
              )
            ),
            version:version_id (
              code,
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching bookmarks:', error);
      } else {
        setBookmarks(data || []);
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader className="text-center">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle>Kirjaudu sisään</CardTitle>
          <CardDescription>
            Kirjaudu sisään nähdäksesi kirjanmerkkisi
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Ladataan kirjanmerkkejä...</span>
        </CardContent>
      </Card>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <Card>
        <CardHeader className="text-center">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle>Ei kirjanmerkkejä</CardTitle>
          <CardDescription>
            Lisää kirjanmerkkejä lukiessasi Raamattua
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Kirjanmerkit</h2>
      </div>
      
      <div className="grid gap-4">
        {bookmarks.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium">
                    {getFinnishBookName(item.verse.chapter.book.name)} {item.verse.chapter.chapter_number}:{item.verse.verse_number}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.verse.version.name} ({item.verse.version.code})
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(item.created_at), 'dd.MM.yyyy HH:mm')}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('Navigating to:', item.verse.chapter.book.name, item.verse.chapter.chapter_number, item.verse.verse_number);
                    // Navigate to the verse by opening the main page with proper parameters
                    const bookName = item.verse.chapter.book.name;
                    window.location.href = `/?book=${encodeURIComponent(bookName)}&chapter=${item.verse.chapter.chapter_number}&verse=${item.verse.verse_number}`;
                  }}
                >
                  Avaa jae
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserBookmarks;