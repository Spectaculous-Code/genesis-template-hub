import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, BookOpen, Trash2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { getFinnishBookName } from '@/lib/bookNameMapping';
import { useToast } from '@/components/ui/use-toast';

interface BookmarkItem {
  id: string;
  created_at: string;
  verses: {
    id: string;
    verse_number: number;
    text: string;
    chapters: {
      chapter_number: number;
      books: {
        name: string;
      };
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
          verses!inner(
            id,
            verse_number,
            text,
            chapters!inner(
              chapter_number,
              books!inner(name)
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

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

  const handleOpenVerse = (bookmark: BookmarkItem) => {
    const bookName = bookmark.verses.chapters.books.name;
    const chapterNumber = bookmark.verses.chapters.chapter_number;
    const verseNumber = bookmark.verses.verse_number;
    
    window.location.href = `/?book=${encodeURIComponent(bookName)}&chapter=${chapterNumber}&verse=${verseNumber}`;
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
            Et ole vielä lisännyt yhtään kirjanmerkkiä
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
                    {getFinnishBookName(bookmark.verses.chapters.books.name)} {bookmark.verses.chapters.chapter_number}:{bookmark.verses.verse_number}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Lisätty {format(new Date(bookmark.created_at), 'dd.MM.yyyy')}
                  </p>
                  <p className="text-sm text-foreground/80 mt-2 line-clamp-2">
                    {bookmark.verses.text}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenVerse(bookmark)}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Avaa
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