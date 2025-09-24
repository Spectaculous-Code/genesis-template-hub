import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, BookOpen, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { getFinnishBookName } from '@/lib/bookNameMapping';
import { useToast } from '@/components/ui/use-toast';

interface BookmarkItem {
  id: string;
  created_at: string;
  verse: {
    id: string;
    verse_number: number;
    text: string;
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

const UserReadingHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
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
            id,
            verse_number,
            text,
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

  const handleDeleteBookmark = async (bookmarkId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Virhe",
          description: "Kirjanmerkin poistaminen epäonnistui",
          variant: "destructive",
        });
      } else {
        setBookmarks(bookmarks.filter(b => b.id !== bookmarkId));
        toast({
          title: "Kirjanmerkki poistettu",
          description: "Kirjanmerkki on poistettu onnistuneesti",
        });
      }
    } catch (error) {
      toast({
        title: "Virhe",
        description: "Kirjanmerkin poistaminen epäonnistui",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader className="text-center">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle>Kirjaudu sisään</CardTitle>
          <CardDescription>
            Kirjaudu sisään nähdäksesi lukuhistoriasi
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
          <span className="ml-2">Ladataan lukuhistoriaa...</span>
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
            Tallenna kirjanmerkkejä lukiessasi Raamattua
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
        {bookmarks.map((bookmark) => (
          <Card key={bookmark.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium">
                    {getFinnishBookName(bookmark.verse.chapter.book.name)} {bookmark.verse.chapter.chapter_number}:{bookmark.verse.verse_number} ({bookmark.verse.version.code}, {format(new Date(bookmark.created_at), 'dd.MM.yyyy')})
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {bookmark.verse.text}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const bookName = bookmark.verse.chapter.book.name;
                      window.location.href = `/?book=${encodeURIComponent(bookName)}&chapter=${bookmark.verse.chapter.chapter_number}&verse=${bookmark.verse.verse_number}`;
                    }}
                  >
                    Avaa jae
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteBookmark(bookmark.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserReadingHistory;