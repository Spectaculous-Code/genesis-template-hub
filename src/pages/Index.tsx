// Main application entry point
import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import MainContent from "@/components/MainContent";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import UserMenu from "@/components/UserMenu";

const Index = () => {
  const [selectedBook, setSelectedBook] = useState("");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [targetVerse, setTargetVerse] = useState<number | undefined>();
  const [currentView, setCurrentView] = useState<'bible' | 'search' | 'summaries' | 'highlights'>('bible');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVerse, setSelectedVerse] = useState<{
    bookName: string;
    chapter: number;
    verse: number;
    text: string;
  } | null>(null);

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

  const [topSearchQuery, setTopSearchQuery] = useState("");

  const handleVerseSelect = (bookName: string, chapter: number, verse: number, text: string) => {
    setSelectedVerse({ bookName, chapter, verse, text });
  };

  const handleTopSearch = (query: string) => {
    if (query.trim()) {
      setSearchQuery(query);
      setCurrentView('search');
    }
  };

  const handleTopSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTopSearch(topSearchQuery);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar 
          onNavigateToContinueAudio={handleNavigateToContinueAudio}
          onNavigateToContinueText={handleNavigateToContinueText}
          onNavigateToSummaries={handleNavigateToSummaries}
          onNavigateToHighlights={handleNavigateToHighlights}
          selectedVerse={selectedVerse}
        />

        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="bg-background border-b border-border p-4">
            <div className="flex items-center justify-between">
            <div className="flex items-center">
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Vapaa haku..."
                    className="pl-10"
                    value={topSearchQuery}
                    onChange={(e) => setTopSearchQuery(e.target.value)}
                    onKeyPress={handleTopSearchKeyPress}
                  />
                </div>
                
                <Link
                  to="/" 
                  className="text-xl font-bold text-foreground hover:text-primary transition-colors"
                >
                  Raamattu Nyt
                </Link>
                
                <UserMenu />
              </div>
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
          />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;