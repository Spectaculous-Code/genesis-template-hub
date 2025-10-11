
import { useState, useEffect } from "react";
import { 
  Book, 
  Play, 
  FileText, 
  BookOpen, 
  Star, 
  Highlighter,
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
  SidebarTrigger,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getFinnishBookName } from "@/lib/bookNameMapping";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

interface AppSidebarProps {
  onNavigateToContinueAudio: () => void;
  onNavigateToContinueText: (book?: string, chapter?: number) => void;
  selectedVerse?: {
    bookName: string;
    chapter: number;
    verse: number;
    text: string;
  } | null;
}

export function AppSidebar({
  onNavigateToContinueAudio,
  onNavigateToContinueText,
  selectedVerse
}: AppSidebarProps) {
  const { state, open, isMobile, toggleSidebar, setOpen } = useSidebar();
  const collapsed = state === "collapsed";
  const { user } = useAuth();
  
  // Hover handlers for auto-expand
  const handleMouseEnter = () => {
    if (!isMobile && collapsed) {
      setOpen(true);
    }
  };
  
  const handleMouseLeave = () => {
    if (!isMobile && !collapsed) {
      setOpen(false);
    }
  };
  const [lastAudioPosition, setLastAudioPosition] = useState<string>("Ei viimeisintä");
  const [lastTextPosition, setLastTextPosition] = useState<string>("Ei viimeisintä");
  const [lastReadingData, setLastReadingData] = useState<any>(null);
  const [summariesCount, setSummariesCount] = useState(0);
  const [highlightsCount, setHighlightsCount] = useState(0);

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


  return (
    <Sidebar
      variant="floating"
      collapsible="icon"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Sidebar trigger and title at the top */}
      <div className="p-2 border-b border-border flex items-center gap-3">
        <SidebarTrigger />
        {!collapsed && (
          <span className="text-primary font-bold text-sm tracking-wide">
            RAAMATTU NYT
          </span>
        )}
      </div>
      
      <SidebarContent>
        {/* Raamattu Section */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>

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
                  <SidebarMenuButton asChild>
                    <Link to="/profile?tab=kirjanmerkit">
                      <FileText className="h-4 w-4" />
                      {!collapsed && <span>Kirjanmerkki</span>}
                    </Link>
                  </SidebarMenuButton>
                  {!collapsed && (
                    <div 
                      className={`ml-8 text-xs ${lastReadingData ? 'text-primary cursor-pointer hover:underline' : 'text-muted-foreground'}`}
                      onClick={() => {
                        if (lastReadingData) {
                          onNavigateToContinueText(lastReadingData.book, lastReadingData.chapter);
                        }
                      }}
                    >
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
          <SidebarGroupLabel className="text-primary font-bold text-sm tracking-wide flex items-center px-3 py-2">
            <Star className="mr-2 h-4 w-4" />
            {!collapsed && "SISÄLTÖNI"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Profile */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/profile">
                    <User className="h-4 w-4" />
                    {!collapsed && <span>Profiili</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* My Summaries */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/profile?tab=koosteet">
                    <FileText className="h-4 w-4" />
                    {!collapsed && <span>Koosteeni ({summariesCount} kpl)</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Highlights */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/profile?tab=korostukset">
                    <Highlighter className="h-4 w-4" />
                    {!collapsed && <span>Korostukseni ({highlightsCount} kpl)</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Fokus Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-bold text-sm tracking-wide flex items-center px-3 py-2">
            <Star className="mr-2 h-4 w-4" />
            {!collapsed && "FOKUS"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {collapsed ? (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Star className="h-4 w-4" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            ) : (
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
                      Valitse jae korostettavaksi
                    </div>
                  </div>
                )}
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
