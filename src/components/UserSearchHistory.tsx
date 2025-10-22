import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Trash2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

interface SearchHistoryItem {
  id: string;
  search_query: string;
  search_type: 'reference' | 'text';
  version_code: string;
  created_at: string;
}

const UserSearchHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSearchHistory();
    }
  }, [user]);

  const loadSearchHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistory((data || []) as SearchHistoryItem[]);
    } catch (error) {
      console.error('Error loading search history:', error);
      toast({
        title: "Virhe",
        description: "Hakuhistorian lataaminen epäonnistui",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchClick = (item: SearchHistoryItem) => {
    navigate(`/search?q=${encodeURIComponent(item.search_query)}&v=${item.version_code}`);
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setHistory(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Poistettu",
        description: "Hakuhistoria poistettu",
      });
    } catch (error) {
      console.error('Error deleting search history:', error);
      toast({
        title: "Virhe",
        description: "Hakuhistorian poistaminen epäonnistui",
        variant: "destructive",
      });
    }
  };

  const handleClearAll = async () => {
    if (!user || history.length === 0) return;

    try {
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      
      setHistory([]);
      toast({
        title: "Tyhjennetty",
        description: "Koko hakuhistoria on tyhjennetty",
      });
    } catch (error) {
      console.error('Error clearing search history:', error);
      toast({
        title: "Virhe",
        description: "Hakuhistorian tyhjentäminen epäonnistui",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Juuri nyt';
    if (diffMins < 60) return `${diffMins} min sitten`;
    if (diffHours < 24) return `${diffHours} tuntia sitten`;
    if (diffDays === 1) return 'Eilen';
    if (diffDays < 7) return `${diffDays} päivää sitten`;
    
    return date.toLocaleDateString('fi-FI', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Ladataan...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Hakuhistoria
            </CardTitle>
            <CardDescription>
              Viimeisimmät hakusi ({history.length})
            </CardDescription>
          </div>
          {history.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleClearAll}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Tyhjennä kaikki
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">Ei hakuhistoriaa</p>
            <p className="text-sm text-muted-foreground mt-2">
              Hakusi tallentuvat automaattisesti tänne
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSearchClick(item)}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.search_query}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.search_type === 'reference' ? 'Raamatunviite' : 'Tekstihaku'} • {formatDate(item.created_at)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  onClick={(e) => handleDeleteItem(item.id, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserSearchHistory;
