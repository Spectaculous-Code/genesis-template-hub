import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { User, Settings, FileText, Highlighter, BookOpen, Headphones, Calendar, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import UserSummaries from '@/components/UserSummaries';
import UserHighlights from '@/components/UserHighlights';
import UserReadingHistory from '@/components/UserReadingHistory';

const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || '');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Get tab from URL params, default to "reading-history"
  const urlParams = new URLSearchParams(location.search);
  const activeTab = urlParams.get('tab') || 'reading-history';

  const handleTabChange = (value: string) => {
    navigate(`/profile?tab=${value}`);
  };

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

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: displayName,
        });

      if (error) {
        toast({
          title: "Virhe",
          description: "Profiilin tallentaminen epäonnistui",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Profiili tallennettu",
          description: "Profiilisi on päivitetty onnistuneesti",
        });
      }
    } catch (error) {
      toast({
        title: "Virhe",
        description: "Profiilin tallentaminen epäonnistui",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>Kirjaudu sisään</CardTitle>
            <CardDescription>
              Kirjaudu sisään nähdäksesi profiilisi
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/auth">
              <Button className="w-full">
                Kirjaudu sisään
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar 
          onNavigateToContinueAudio={() => navigate('/')}
          onNavigateToContinueText={() => navigate('/')}
          onNavigateToSummaries={() => handleTabChange('summaries')}
          onNavigateToHighlights={() => handleTabChange('highlights')}
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

          <div className="container mx-auto p-6 max-w-4xl">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-foreground">Profiili</h1>
              <p className="text-muted-foreground">Hallitse profiiliasi ja näe aktiviteettisi</p>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="reading-history" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Lukuhistoria
                </TabsTrigger>
                <TabsTrigger value="bookmarks" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Kirjanmerkit
                </TabsTrigger>
                <TabsTrigger value="listening-history" className="flex items-center gap-2" disabled>
                  <Headphones className="h-4 w-4" />
                  Kuunteluhistoria
                </TabsTrigger>
                <TabsTrigger value="reading-plan" className="flex items-center gap-2" disabled>
                  <Calendar className="h-4 w-4" />
                  Lukusuunnitelma
                </TabsTrigger>
                <TabsTrigger value="summaries" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Koosteeni
                </TabsTrigger>
                <TabsTrigger value="highlights" className="flex items-center gap-2">
                  <Highlighter className="h-4 w-4" />
                  Korostukseni
                </TabsTrigger>
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Asetukset
                </TabsTrigger>
              </TabsList>

              <TabsContent value="reading-history">
                <UserReadingHistory />
              </TabsContent>

              <TabsContent value="bookmarks">
                <Card>
                  <CardHeader className="text-center">
                    <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <CardTitle>Kirjanmerkit</CardTitle>
                    <CardDescription>
                      Tämä ominaisuus on tulossa pian
                    </CardDescription>
                  </CardHeader>
                </Card>
              </TabsContent>

              <TabsContent value="listening-history">
                <Card>
                  <CardHeader className="text-center">
                    <Headphones className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <CardTitle>Kuunteluhistoria</CardTitle>
                    <CardDescription>
                      Tämä ominaisuus on tulossa pian
                    </CardDescription>
                  </CardHeader>
                </Card>
              </TabsContent>

              <TabsContent value="reading-plan">
                <Card>
                  <CardHeader className="text-center">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <CardTitle>Lukusuunnitelma</CardTitle>
                    <CardDescription>
                      Tämä ominaisuus on tulossa pian
                    </CardDescription>
                  </CardHeader>
                </Card>
              </TabsContent>

              <TabsContent value="summaries">
                <UserSummaries />
              </TabsContent>

              <TabsContent value="highlights">
                <UserHighlights />
              </TabsContent>

              <TabsContent value="profile" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Profiilin tiedot</CardTitle>
                    <CardDescription>
                      Muokkaa henkilökohtaisia tietojasi
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Sähköposti</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user.email}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Näyttönimi</Label>
                      <Input
                        id="displayName"
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Anna näyttönimesi"
                      />
                    </div>
                    <Button 
                      onClick={handleSaveProfile} 
                      disabled={saving}
                      className="w-full sm:w-auto"
                    >
                      {saving ? "Tallennetaan..." : "Tallenna muutokset"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ProfilePage;