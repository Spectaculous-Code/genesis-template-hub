// Main application entry point
import { useState, useEffect } from "react";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import MainContent from "@/components/MainContent";
import { Input } from "@/components/ui/input";
import { Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import UserMenu from "@/components/UserMenu";
import { useLatestReadingPosition } from "@/hooks/useLatestReadingPosition";
import { SearchSidebar } from "@/components/SearchSidebar";
import { performSearch, searchTextExtended, SearchResult } from "@/lib/searchService";
import { getBookOrder } from "@/lib/bookNameMapping";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const IndexContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { latestPosition } = useLatestReadingPosition();
  const { setOpen } = useSidebar();
  const { user } = useAuth();
  const [selectedBook, setSelectedBook] = useState("");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [targetVerse, setTargetVerse] = useState<number | undefined>();
  const [currentView, setCurrentView] = useState<'bible' | 'search' | 'summaries' | 'highlights'>('bible');
  const [searchQuery, setSearchQuery] = useState("");
  const [versionCode, setVersionCode] = useState("finstlk201");
  const [selectedVerse, setSelectedVerse] = useState<{
    bookName: string;
    chapter: number;
    verse: number;
    text: string;
  } | null>(null);
  const [isAppTitleNavigation, setIsAppTitleNavigation] = useState(false);
  
  // Search state
  const [searchSidebarOpen, setSearchSidebarOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [extendedSearchResults, setExtendedSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Handle URL parameters for navigation from history
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const bookParam = urlParams.get('book');
    const chapterParam = urlParams.get('chapter');
    const verseParam = urlParams.get('verse');
    const searchParam = urlParams.get('search');

    if (bookParam && chapterParam) {
      setSelectedBook(bookParam);
      setSelectedChapter(parseInt(chapterParam));
      if (verseParam) {
        setTargetVerse(parseInt(verseParam));
      }
      setCurrentView('bible');
    } else if (searchParam) {
      setSearchQuery(searchParam);
      setCurrentView('search');
    }
  }, [location.search]);

  // Set default book if none selected and no latest position
  useEffect(() => {
    if (!selectedBook && latestPosition === null) {
      // Set Genesis 1 as default when app loads with no saved position
      setSelectedBook('Genesis');
      setSelectedChapter(1);
      setCurrentView('bible');
    } else if (!selectedBook && latestPosition) {
      // Set latest position if available
      setSelectedBook(latestPosition.bookName);
      setSelectedChapter(latestPosition.chapter);
      if (latestPosition.verse) {
        setTargetVerse(latestPosition.verse);
      }
      setCurrentView('bible');
    }
  }, [selectedBook, latestPosition]);

  const handleBookSelect = (book: string) => {
    setSelectedBook(book);
    setTargetVerse(undefined);
  };

  const handleChapterSelect = (chapter: number) => {
    setSelectedChapter(chapter);
    setTargetVerse(undefined);
  };

  const handleNavigateToSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentView('search');
  };

  const handleNavigateToContinueAudio = () => {
    setCurrentView('bible');
    // TODO: Load last audio position
  };

  const handleNavigateToContinueText = (book?: string, chapter?: number) => {
    if (book && chapter) {
      // Navigate to the saved reading position
      setSelectedBook(book);
      setSelectedChapter(chapter);
      setTargetVerse(undefined);
    }
    setCurrentView('bible');
  };

  const handleNavigateToSummaries = () => {
    setCurrentView('summaries');
  };

  const handleNavigateToHighlights = () => {
    setCurrentView('highlights');
  };

  const handleNavigateToVerse = (bookName: string, chapter: number, verse?: number, text?: string) => {
    setSelectedBook(bookName);
    setSelectedChapter(chapter);
    setTargetVerse(verse);
    setCurrentView('bible');
  };

  const handleAppTitleClick = () => {
    console.log('App title clicked, latestPosition:', latestPosition);
    
    // Set the navigation flag first and keep it true
    setIsAppTitleNavigation(true);
    
    if (latestPosition) {
      // Navigate to latest reading position without saving
      console.log('Navigating to latest position:', latestPosition);
      console.log('Setting navigation with isAppTitleNavigation TRUE');
      
      setSelectedBook(latestPosition.bookName);
      setSelectedChapter(latestPosition.chapter);
      setTargetVerse(latestPosition.verse);
      setCurrentView('bible');
    } else {
      // Fallback to Genesis 1 if no reading history
      console.log('No latest position, falling back to Genesis 1');
      console.log('Setting navigation with isAppTitleNavigation TRUE');
      setSelectedBook('Genesis');
      setSelectedChapter(1);
      setTargetVerse(undefined);
      setCurrentView('bible');
    }
  };

  const [topSearchQuery, setTopSearchQuery] = useState("");

  const handleVerseSelect = (bookName: string, chapter: number, verse: number, text: string) => {
    setSelectedVerse({ bookName, chapter, verse, text });
  };

  const handleTopSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setSearchSidebarOpen(false);
    
    try {
      // Perform regular search
      const result = await performSearch(query, versionCode);
      setSearchResults(result);
      
      // Save to search history
      if (user) {
        console.log("Saving search to history:", { query, type: result.type, versionCode, userId: user.id });
        const { data, error } = await supabase.from('search_history').insert({
          user_id: user.id,
          search_query: query,
          search_type: result.type,
          version_code: versionCode
        }).select();
        if (error) {
          console.error("Error saving search history:", error);
          console.error("Error details:", JSON.stringify(error, null, 2));
        } else {
          console.log("Search history saved successfully", data);
        }
      } else {
        console.log("No user, skipping search history save");
      }
      
      // Clear extended results when doing new search
      setExtendedSearchResults(null);
      
      // Open sidebar after search
      setSearchSidebarOpen(true);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleExtendedSearch = async () => {
    if (!topSearchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      const extResult = await searchTextExtended(topSearchQuery, versionCode);
      setExtendedSearchResults(extResult);
    } catch (error) {
      console.error("Extended search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleTopSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTopSearch(topSearchQuery);
    }
  };

  const handleSearchVerseClick = (verse: any) => {
    // Close sidebar but keep results
    setSearchSidebarOpen(false);
    // Navigate to the verse in BibleReader
    setSelectedBook(verse.book_name);
    setSelectedChapter(verse.chapter_number);
    setTargetVerse(verse.verse_number);
    setCurrentView('bible');
  };

  // Sort and filter search results
  const sortedSearchVerses = searchResults?.verses ? [...searchResults.verses].sort((a, b) => {
    const orderA = getBookOrder(a.book_name);
    const orderB = getBookOrder(b.book_name);
    if (orderA !== orderB) return orderA - orderB;
    if (a.chapter_number !== b.chapter_number) return a.chapter_number - b.chapter_number;
    return a.verse_number - b.verse_number;
  }) : [];

  const newExtendedVerses = extendedSearchResults?.verses 
    ? extendedSearchResults.verses.filter(extVerse => 
        !sortedSearchVerses.some(origVerse => origVerse.verse_id === extVerse.verse_id)
      ).sort((a, b) => {
        const orderA = getBookOrder(a.book_name);
        const orderB = getBookOrder(b.book_name);
        if (orderA !== orderB) return orderA - orderB;
        if (a.chapter_number !== b.chapter_number) return a.chapter_number - b.chapter_number;
        return a.verse_number - b.verse_number;
      })
    : [];

  return (
    <>
      <AppSidebar
        onNavigateToContinueAudio={handleNavigateToContinueAudio}
        onNavigateToContinueText={handleNavigateToContinueText}
        selectedVerse={selectedVerse}
      />

      <div className="flex-1 flex flex-col min-w-0 mr-12">
          {/* Top Header */}
          <header className="bg-background border-b border-border p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Vapaa haku..."
                  className="pl-10"
                  value={topSearchQuery}
                  onChange={(e) => setTopSearchQuery(e.target.value)}
                  onKeyPress={handleTopSearchKeyPress}
                />
              </div>
              
              <Button
                variant="ghost"
                onClick={() => {
                  console.log('Button clicked!');
                  handleAppTitleClick();
                }}
                className="text-xl font-bold text-foreground hover:text-primary transition-colors whitespace-nowrap"
              >
                Raamattu Nyt
              </Button>
              
              <UserMenu />
            </div>
          </header>

          <MainContent
            selectedBook={selectedBook}
            selectedChapter={selectedChapter}
            targetVerse={targetVerse}
            onBookSelect={handleBookSelect}
            onChapterSelect={handleChapterSelect}
            onNavigateToVerse={handleNavigateToVerse}
            onVerseSelect={handleVerseSelect}
            currentView={currentView}
            searchQuery={searchQuery}
            isAppTitleNavigation={isAppTitleNavigation}
            onNavigationComplete={() => {
              console.log('Navigation complete callback called, resetting isAppTitleNavigation to false');
              setIsAppTitleNavigation(false);
            }}
            onVersionChange={setVersionCode}
          />
        </div>

      <div className="fixed right-0 top-0 bottom-0 z-50 pointer-events-none">
        <SidebarProvider open={searchSidebarOpen} onOpenChange={setSearchSidebarOpen}>
          <div className="pointer-events-auto">
            <SearchSidebar 
              results={sortedSearchVerses}
              extendedResults={newExtendedVerses}
              versionCode={versionCode}
              onVerseClick={handleSearchVerseClick}
              isLoading={isSearching}
              onExtendedSearch={handleExtendedSearch}
              canExtendSearch={searchResults?.type === 'text' && sortedSearchVerses.length > 0}
            />
          </div>
        </SidebarProvider>
      </div>
      </>
  );
};

const Index = () => {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <IndexContent />
      </div>
    </SidebarProvider>
  );
};

export default Index;