import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Plus, FileText, Calendar, User, BookOpen, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { fi } from "date-fns/locale";

interface Summary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  groups: SummaryGroup[];
}

interface SummaryGroup {
  id: string;
  subtitle: string;
  text_content: string | null;
  group_order: number;
  bible_references: BibleReference[];
}

interface BibleReference {
  id: string;
  reference_text: string;
  reference_order: number;
  version_id: string | null;
}

const SummaryPage = () => {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [latestSummary, setLatestSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSearch = (query: string) => {
    if (query.trim()) {
      // Navigate to home with search query
      navigate(`/?search=${encodeURIComponent(query)}`);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchSummaries();
  }, [user, navigate]);

  const fetchSummaries = async () => {
    if (!user) return;

    try {
      const { data: summariesData, error } = await supabase
        .from('summaries')
        .select(`
          id,
          title,
          created_at,
          updated_at,
          summary_groups (
            id,
            subtitle,
            text_content,
            group_order,
            summary_bible_references (
              id,
              reference_text,
              reference_order,
              version_id
            )
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching summaries:', error);
        toast({
          title: "Virhe",
          description: "Koosteiden lataaminen epäonnistui",
          variant: "destructive"
        });
        return;
      }

      const processedSummaries: Summary[] = summariesData?.map(summary => ({
        ...summary,
        groups: summary.summary_groups
          .map(group => ({
            ...group,
            bible_references: group.summary_bible_references.sort((a, b) => a.reference_order - b.reference_order)
          }))
          .sort((a, b) => a.group_order - b.group_order)
      })) || [];

      setSummaries(processedSummaries);
      setLatestSummary(processedSummaries[0] || null);
    } catch (error) {
      console.error('Error fetching summaries:', error);
      toast({
        title: "Virhe",
        description: "Koosteiden lataaminen epäonnistui",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewSummary = async () => {
    if (!user) return;

    const newTitle = `Uusi kooste ${format(new Date(), 'dd.MM.yyyy')}`;
    
    try {
      const { data, error } = await supabase
        .from('summaries')
        .insert({
          user_id: user.id,
          title: newTitle
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating summary:', error);
        toast({
          title: "Virhe",
          description: "Koosteen luominen epäonnistui",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Kooste luotu",
        description: newTitle
      });

      fetchSummaries();
    } catch (error) {
      console.error('Error creating summary:', error);
      toast({
        title: "Virhe",
        description: "Koosteen luominen epäonnistui",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <SidebarProvider defaultOpen={false}>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar 
            onNavigateToContinueAudio={() => navigate('/')}
            onNavigateToContinueText={() => navigate('/')}
            onNavigateToSummaries={() => navigate('/summaries')}
            onNavigateToHighlights={() => navigate('/profile')}
            selectedVerse={null}
          />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-12">
              <div className="text-muted-foreground">Ladataan koosteitasi...</div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar 
          onNavigateToContinueAudio={() => navigate('/')}
          onNavigateToContinueText={() => navigate('/')}
          onNavigateToSummaries={() => navigate('/summaries')}
          onNavigateToHighlights={() => navigate('/profile')}
          selectedVerse={null}
        />

        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="bg-background border-b border-border p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Vapaa haku..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                />
              </div>
              
              <Link 
                to="/" 
                className="text-xl font-bold text-foreground hover:text-primary transition-colors whitespace-nowrap"
              >
                Raamattu Nyt
              </Link>
            </div>
          </header>

          <div className="container mx-auto p-6 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Koosteet</h1>
                <p className="text-muted-foreground mt-1">
                  Hallitse ja järjestä Raamatun jakeita aiheittain
                </p>
              </div>
              <Button onClick={createNewSummary} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Luo uusi kooste
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Latest Summary (Main content) */}
              <div className="lg:col-span-2">
                {latestSummary ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            {latestSummary.title}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(latestSummary.updated_at), 'dd.MM.yyyy HH:mm', { locale: fi })}
                            </span>
                            <Badge variant="secondary">Viimeisin</Badge>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {latestSummary.groups.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Tämä kooste on tyhjä.</p>
                          <p className="text-sm mt-1">Lisää ryhmiä ja raamatunviittauksia aloittaaksesi.</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {latestSummary.groups.map((group) => (
                            <div key={group.id} className="border rounded-lg p-4">
                              <h3 className="font-semibold text-lg mb-2">{group.subtitle}</h3>
                              {group.text_content && (
                                <p className="text-muted-foreground mb-3">{group.text_content}</p>
                              )}
                              {group.bible_references.length > 0 && (
                                <div className="space-y-1">
                                  <h4 className="text-sm font-medium text-muted-foreground">Raamatunviittaukset:</h4>
                                  <ul className="list-disc list-inside space-y-1">
                                    {group.bible_references.map((ref) => (
                                      <li key={ref.id} className="text-sm">
                                        {ref.reference_text}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h2 className="text-xl font-semibold mb-2">Ei koosteitasi vielä</h2>
                      <p className="text-muted-foreground mb-4">
                        Luo ensimmäinen koosteesi aloittaaksesi Raamatun jakeiden järjestelyn aiheittain.
                      </p>
                      <Button onClick={createNewSummary} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Luo ensimmäinen kooste
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Summaries List (Sidebar) */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Kaikki koosteet</CardTitle>
                    <CardDescription>
                      {summaries.length} {summaries.length === 1 ? 'kooste' : 'koostetta'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {summaries.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        <p className="text-sm">Ei koosteitasi</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {summaries.map((summary, index) => (
                          <div
                            key={summary.id}
                            className={`p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors ${
                              index === 0 ? 'bg-primary/5 border-primary/20' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm line-clamp-1">
                                  {summary.title}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(summary.updated_at), 'dd.MM.yyyy', { locale: fi })}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {summary.groups.length} ryhmää
                                  </Badge>
                                  {index === 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                      Viimeisin
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default SummaryPage;