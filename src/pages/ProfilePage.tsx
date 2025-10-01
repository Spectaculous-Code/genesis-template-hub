import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { User, BookOpen, Search, Highlighter, FileText, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import UserReadingHistory from '@/components/UserReadingHistory';
import UserHighlights from '@/components/UserHighlights';
import UserSummaries from '@/components/UserSummaries';

const ProfileContent = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { setOpen } = useSidebar();
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || '');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Get tab from URL params, default to "profiili"
  const urlParams = new URLSearchParams(location.search);
  const activeTab = urlParams.get('tab') || 'profiili';

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
    <>
      <AppSidebar 
        onNavigateToContinueAudio={() => navigate('/')}
        onNavigateToContinueText={() => navigate('/')}
        onNavigateToSummaries={() => navigate('/profile')}
        onNavigateToHighlights={() => navigate('/profile')}
        selectedVerse={null}
      />

      <div 
        className="flex-1 flex flex-col"
        onMouseEnter={() => setOpen(false)}
      >
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
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="profiili" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profiili
                </TabsTrigger>
                <TabsTrigger value="kirjanmerkit" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Kirjanmerkit
                </TabsTrigger>
                <TabsTrigger value="korostukset" className="flex items-center gap-2">
                  <Highlighter className="h-4 w-4" />
                  Korostukset
                </TabsTrigger>
                <TabsTrigger value="koosteet" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Koosteet
                </TabsTrigger>
                <TabsTrigger value="lukusuunnitelma" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Lukusuunnitelma
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profiili">
                <Card>
                  <CardHeader>
                    <CardTitle>Profiilitiedot</CardTitle>
                    <CardDescription>
                      Muokkaa profiilitietojasi
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Sähköposti</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Näyttönimi</Label>
                      <Input
                        id="displayName"
                        type="text"
                        placeholder="Anna näyttönimesi"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                      />
                    </div>
                    <Button 
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="w-full"
                    >
                      {saving ? "Tallennetaan..." : "Tallenna muutokset"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="kirjanmerkit">
                <UserReadingHistory />
              </TabsContent>

              <TabsContent value="korostukset">
                <UserHighlights />
              </TabsContent>

              <TabsContent value="koosteet">
                <UserSummaries />
              </TabsContent>

              <TabsContent value="lukusuunnitelma">
                <Card>
                  <CardHeader className="text-center">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <CardTitle>Lukusuunnitelma</CardTitle>
                    <CardDescription>
                      Tämä ominaisuus on tulossa pian
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-muted-foreground mb-4">
                      Pian voit luoda henkilökohtaisia lukusuunnitelmia ja seurata edistymistäsi Raamatun lukemisessa.
                    </p>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">
                        💡 Tulossa: Päivittäiset lukutehtävät, edistymisen seuranta ja henkilökohtaiset tavoitteet
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </>
  );
};

const ProfilePage = () => {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <ProfileContent />
      </div>
    </SidebarProvider>
  );
};

export default ProfilePage;