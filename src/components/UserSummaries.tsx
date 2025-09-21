import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';

interface Summary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const UserSummaries = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summaries, setSummaries] = useState<Summary[]>([]);
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
        .from('summaries')
        .select('id, title, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

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

  const handleViewSummary = (summaryId: string) => {
    navigate(`/summaries?id=${summaryId}`);
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
                  {summary.title}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => handleViewSummary(summary.id)}>
                  <Eye className="h-4 w-4 mr-1" />
                  Näytä kooste
                </Button>
              </div>
              <CardDescription>
                Luotu: {new Date(summary.created_at).toLocaleDateString('fi-FI')}
                {summary.updated_at !== summary.created_at && (
                  <span className="ml-2">
                    • Päivitetty: {new Date(summary.updated_at).toLocaleDateString('fi-FI')}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserSummaries;