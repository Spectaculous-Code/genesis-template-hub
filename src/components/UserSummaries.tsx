import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getFinnishBookName } from '@/lib/bookNameMapping';

interface UserSummary {
  id: string;
  content: string;
  created_at: string;
  verses: {
    verse_number: number;
    chapters: {
      chapter_number: number;
      books: {
        name: string;
      };
    };
  };
}

const UserSummaries = () => {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSummaries();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSummaries = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_markings')
        .select(`
          id,
          content,
          created_at,
          verses!inner(
            verse_number,
            chapters!inner(
              chapter_number,
              books!inner(name)
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('marking_type', 'comment')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching summaries:', error);
      } else {
        setSummaries(data || []);
      }
    } catch (error) {
      console.error('Error fetching summaries:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>Kirjaudu sisään</CardTitle>
            <CardDescription>
              Kirjaudu sisään nähdäksesi koosteesi ja muistiinpanosi
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Ladataan koosteita...</p>
        </div>
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>Ei koosteita</CardTitle>
            <CardDescription>
              Et ole vielä luonut yhtään koostetta. Luo muistiinpanoja jakeista aloittaaksesi!
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Koosteeni</h2>
        <div className="text-sm text-muted-foreground">
          {summaries.length} koostetta
        </div>
      </div>

      <div className="space-y-4">
        {summaries.map((summary) => (
          <Card key={summary.id} className="w-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {getFinnishBookName(summary.verses.chapters.books.name)} {' '}
                  {summary.verses.chapters.chapter_number}:{summary.verses.verse_number}
                </CardTitle>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Avaa jae
                </Button>
              </div>
              <CardDescription>
                {new Date(summary.created_at).toLocaleDateString('fi-FI')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{summary.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserSummaries;