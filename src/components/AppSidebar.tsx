
import { useState, useEffect } from "react";
import { 
  Book, 
  Search, 
  History, 
  Play, 
  FileText, 
  BookOpen, 
  Star, 
  Highlighter,
  ChevronDown,
  ChevronRight,
  User
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getFinnishBookName } from "@/lib/bookNameMapping";
import UserMenu from "@/components/UserMenu";
import { useAuth } from "@/hooks/useAuth";

interface AppSidebarProps {
  onNavigateToSearch: (query: string) => void;
  onNavigateToContinueAudio: () => void;
  onNavigateToContinueText: (book?: string, chapter?: number) => void;
  onNavigateToSummaries: () => void;
  onNavigateToHighlights: () => void;
  selectedVerse?: {
    bookName: string;
    chapter: number;
    verse: number;
    text: string;
  } | null;
}

export function AppSidebar({
  onNavigateToSearch,
  onNavigateToContinueAudio,
  onNavigateToContinueText,
  onNavigateToSummaries,
  onNavigateToHighlights,
  selectedVerse
}: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [lastAudioPosition, setLastAudioPosition] = useState<string>("Ei viimeisintä");
  const [lastTextPosition, setLastTextPosition] = useState<string>("Ei viimeisintä");
  const [lastReadingData, setLastReadingData] = useState<any>(null);
  const [summariesCount, setSummariesCount] = useState(0);
  const [highlightsCount, setHighlightsCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      // Fetch last audio position
      const { data: audioHistory } = await supabase
        .from('user_reading_history')
        .select(`
          chapter_number,
          verse_number,
          books!inner(name)
        `)
        .eq('user_id', user.id)
        .eq('history_type', 'listen')
        .order('last_read_at', { ascending: false })
        .limit(1);

      if (audioHistory && audioHistory.length > 0) {
        const record = audioHistory[0];
        const bookName = getFinnishBookName(record.books.name);
        setLastAudioPosition(`${bookName} ${record.chapter_number}:${record.verse_number}`);
      }

      // Fetch last text position
      const { data: textHistory } = await supabase
        .from('user_reading_history')
        .select(`
          chapter_number,
          verse_number,
          books!inner(name)
        `)
        .eq('user_id', user.id)
        .eq('history_type', 'read')
        .order('last_read_at', { ascending: false })
        .limit(1);

      if (textHistory && textHistory.length > 0) {
        const record = textHistory[0];
        const bookName = getFinnishBookName(record.books.name);
        setLastTextPosition(`${bookName} ${record.chapter_number}:${record.verse_number}`);
      }

      // Fetch summaries count (using user_markings table with marking_type 'summary')
      const { count: summariesCountResult } = await supabase
        .from('user_markings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('marking_type', 'comment');

      setSummariesCount(summariesCountResult || 0);

      // Fetch highlights count
      const { count: highlightsCountResult } = await supabase
        .from('highlights')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setHighlightsCount(highlightsCountResult || 0);
    };

    fetchUserData();
    
    // Load last reading position from localStorage
    loadLastReadingPosition();

    // Set up an interval to check for reading position updates
    const positionCheckInterval = setInterval(loadLastReadingPosition, 2000);
    
    return () => clearInterval(positionCheckInterval);
  }, [user]);

  const loadLastReadingPosition = () => {
    try {
      const savedPosition = localStorage.getItem('lastReadingPosition');
      if (savedPosition) {
        const positionData = JSON.parse(savedPosition);
        setLastReadingData(positionData);
        setLastTextPosition(`${positionData.bookName} ${positionData.chapter}`);
      } else {
        setLastReadingData(null);
        setLastTextPosition("Ei viimeisintä");
      }
    } catch (error) {
      console.error('Error loading reading position:', error);
      setLastReadingData(null);
      setLastTextPosition("Ei viimeisintä");
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onNavigateToSearch(searchQuery.trim());
      toast({
        title: "Haku käynnistetty",
        description: `Haetaan: "${searchQuery}"`,
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const mockSearchHistory = [
    "Rakkaus",
    "Usko",
    "Toivo",
    "Matt 5:14",
    "Psalm 23"
  ];

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          {!collapsed && <h1 className="text-lg font-semibold text-foreground">Raamattu Nyt</h1>}
          <div className="flex items-center gap-2">
            {!collapsed && <UserMenu />}
            <SidebarTrigger className="h-6 w-6" />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Raamattu Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-semibold">
            <Book className="mr-2 h-4 w-4" />
            {!collapsed && "RAAMATTUNI"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Search */}
              <SidebarMenuItem>
                <Collapsible open={showSearchHistory} onOpenChange={setShowSearchHistory}>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      {!collapsed && (
                        <div className="flex-1 flex items-center gap-1">
                          <Input
                            placeholder="Haku..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="h-8"
                          />
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              {showSearchHistory ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                      )}
                    </div>
                    
                    {!collapsed && (
                      <CollapsibleContent className="ml-6">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground mb-2">Hakuhistoria</div>
                          {mockSearchHistory.map((item, index) => (
                            <Button
                              key={index}
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start h-7 text-xs"
                              onClick={() => {
                                setSearchQuery(item);
                                onNavigateToSearch(item);
                              }}
                            >
                              <History className="mr-2 h-3 w-3" />
                              {item}
                            </Button>
                          ))}
                        </div>
                      </CollapsibleContent>
                    )}
                  </div>
                </Collapsible>
              </SidebarMenuItem>

              {/* Continue Audio */}
              <SidebarMenuItem>
                <div className="space-y-1">
                  <SidebarMenuButton onClick={onNavigateToContinueAudio}>
                    <Play className="h-4 w-4" />
                    {!collapsed && <span>Jatka kuuntelua</span>}
                  </SidebarMenuButton>
                  {!collapsed && (
                    <div className="ml-8 text-xs text-muted-foreground">
                      {lastAudioPosition}
                    </div>
                  )}
                </div>
              </SidebarMenuItem>

              {/* Continue Text */}
              <SidebarMenuItem>
                <div className="space-y-1">
                  <SidebarMenuButton 
                    onClick={() => {
                      if (lastReadingData) {
                        // Navigate to the saved reading position
                        onNavigateToContinueText(lastReadingData.book, lastReadingData.chapter);
                      } else {
                        onNavigateToContinueText();
                      }
                    }}
                    className={lastReadingData ? "cursor-pointer" : ""}
                  >
                    <FileText className="h-4 w-4" />
                    {!collapsed && <span>Jatka lukemista</span>}
                  </SidebarMenuButton>
                  {!collapsed && (
                    <div className={`ml-8 text-xs ${lastReadingData ? 'text-primary cursor-pointer' : 'text-muted-foreground'}`}>
                      {lastTextPosition}
                    </div>
                  )}
                </div>
              </SidebarMenuItem>

              {/* Continue Reading Program */}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  disabled
                  className="opacity-50 cursor-not-allowed"
                >
                  <BookOpen className="h-4 w-4" />
                  {!collapsed && <span>Lukuohjelma (tulossa)</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sisältöni Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-semibold">
            <Star className="mr-2 h-4 w-4" />
            {!collapsed && "SISÄLTÖNI"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Profile */}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => window.location.href = '/profile'}
                >
                  <User className="h-4 w-4" />
                  {!collapsed && <span>Profiili</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* My Summaries */}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onNavigateToSummaries}>
                  <FileText className="h-4 w-4" />
                  {!collapsed && <span>Koosteeni ({summariesCount} kpl)</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Highlights */}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onNavigateToHighlights}>
                  <Highlighter className="h-4 w-4" />
                  {!collapsed && <span>Korostukseni ({highlightsCount} kpl)</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Fokus Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-semibold">
            <Star className="mr-2 h-4 w-4" />
            {!collapsed && "FOKUS"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2">
              {selectedVerse ? (
                <div className="border border-border rounded-lg p-3 bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-medium text-muted-foreground">
                      {getFinnishBookName(selectedVerse.bookName)} {selectedVerse.chapter}:{selectedVerse.verse}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        // Get the English book name for the URL
                        const englishBookName = selectedVerse.bookName;
                        console.log('Navigating to study page with book:', englishBookName);
                        window.location.href = `/study/${englishBookName}/${selectedVerse.chapter}/${selectedVerse.verse}`;
                      }}
                    >
                      <BookOpen className="h-3 w-3 mr-1" />
                      TUTKI
                    </Button>
                  </div>
                  <div className="text-sm leading-relaxed text-foreground">
                    {selectedVerse.text}
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-muted-foreground/30 rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground">
                    {!collapsed ? "Valitse jae korostettavaksi" : "Ei valintaa"}
                  </div>
                </div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
