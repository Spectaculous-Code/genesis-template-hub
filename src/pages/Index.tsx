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

const IndexContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { latestPosition } = useLatestReadingPosition();
  const { setOpen } = useSidebar();
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
      
      // Open sidebar if we have results
      if (result.verses && result.verses.length > 0) {
        setSearchSidebarOpen(true);
      }
      
      // Auto-trigger extended search for text searches
      if (result.type === 'text') {
        const extResult = await searchTextExtended(query, versionCode);
        setExtendedSearchResults(extResult);
      }
    } catch (error) {
      console.error("Search error:", error);
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

      <div 
        className="flex-1 flex flex-col"
        onMouseEnter={() => setOpen(false)}
      >
          {/* Top Header */}
          <header className="bg-background border-b border-border p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-lg flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Vapaa haku..."
                    className="pl-10"
                    value={topSearchQuery}
                    onChange={(e) => setTopSearchQuery(e.target.value)}
                    onKeyPress={handleTopSearchKeyPress}
                  />
                </div>
                {searchResults?.type === 'text' && sortedSearchVerses.length > 0 && (
                  <Button 
                    onClick={() => handleTopSearch(topSearchQuery)}
                    variant="outline"
                    size="sm"
                    disabled={isSearching}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Laajennettu
                  </Button>
                )}
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

      <SearchSidebar 
        results={sortedSearchVerses}
        extendedResults={newExtendedVerses}
        versionCode={versionCode}
        onVerseClick={handleSearchVerseClick}
        isLoading={isSearching}
      />
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