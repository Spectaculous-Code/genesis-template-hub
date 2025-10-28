import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, SkipBack, SkipForward, Volume2, Bookmark } from "lucide-react";
import BibleReader from "./BibleReader";
import UserSummaries from "./UserSummaries";
import UserHighlights from "./UserHighlights";
import { getBibleBooks, BibleBook } from "@/lib/bibleService";
import { getFinnishBookName, getEnglishBookName } from "@/lib/bookNameMapping";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useRef } from "react";
import { useLatestReadingPosition } from "@/hooks/useLatestReadingPosition";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface BibleVersion {
  id: string;
  name: string;
  code: string;
}

interface MainContentProps {
  selectedBook: string;
  selectedChapter: number;
  targetVerse?: number;
  onBookSelect: (book: string) => void;
  onChapterSelect: (chapter: number) => void;
  onNavigateToVerse: (bookName: string, chapter: number, verse?: number, text?: string) => void;
  onVerseSelect: (bookName: string, chapter: number, verse: number, text: string) => void;
  currentView: 'bible' | 'search' | 'summaries' | 'highlights';
  searchQuery?: string;
  isAppTitleNavigation?: boolean;
  onNavigationComplete?: () => void;
  onVersionChange?: (versionCode: string) => void;
}

const MainContent = ({
  selectedBook,
  selectedChapter,
  targetVerse,
  onBookSelect,
  onChapterSelect,
  onNavigateToVerse,
  onVerseSelect,
  currentView,
  searchQuery = "",
  isAppTitleNavigation = false,
  onNavigationComplete,
  onVersionChange
}: MainContentProps) => {
  console.log('MainContent render - isAppTitleNavigation:', isAppTitleNavigation);
  const [bibleBooks, setBibleBooks] = useState<BibleBook[]>([]);
  const [bibleVersions, setBibleVersions] = useState<BibleVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [isFromLatestPosition, setIsFromLatestPosition] = useState(false);
  const [hasManuallyNavigated, setHasManuallyNavigated] = useState(false);
  const bibleReaderRef = useRef<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { latestPosition, loading: positionLoading, refetch: refetchLatestPosition } = useLatestReadingPosition();
  const navigate = useNavigate();

  // Wrapper functions to reset isFromLatestPosition when user manually navigates
  const handleBookSelect = async (bookName: string) => {
    if (bookName !== selectedBook) {
      setIsFromLatestPosition(false);
      setHasManuallyNavigated(true);
    }
    onBookSelect(bookName);
  };

  const handleChapterSelect = async (chapterNumber: number) => {
    if (chapterNumber !== selectedChapter) {
      setIsFromLatestPosition(false);
      setHasManuallyNavigated(true);
    }
    onChapterSelect(chapterNumber);
  };

  // Update BibleReader when manual navigation happens
  useEffect(() => {
    if (hasManuallyNavigated) {
      // Trigger BibleReader to mark user navigation
      setHasManuallyNavigated(false);
    }
  }, [hasManuallyNavigated]);
  const saveReadingPositionToDB = async (bookName: string, chapterNum: number, versionCode: string) => {
    if (!user) return;

    try {
      // First get the version ID
      const { data: versionData } = await (supabase as any)
        .schema('bible_schema')
        .from('bible_versions')
        .select('id')
        .eq('code', versionCode)
        .single();

      if (versionData) {
        // Then get the book data
        const { data: bookData } = await (supabase as any)
          .schema('bible_schema')
          .from('books')
          .select('id')
          .eq('name', bookName)
          .eq('version_id', versionData.id)
          .single();

        if (bookData) {
          // Get the chapter data  
          const { data: chapterData } = await (supabase as any)
            .schema('bible_schema')
            .from('chapters')
            .select('id')
            .eq('book_id', bookData.id)
            .eq('chapter_number', chapterNum)
            .single();

          if (chapterData) {
            // Save to user_reading_history
            await supabase
              .from('user_reading_history')
              .upsert({
                user_id: user.id,
                book_id: bookData.id,
                chapter_id: chapterData.id,
                version_id: versionData.id,
                chapter_number: chapterNum,
                verse_number: 1, // Default to verse 1
                last_read_at: new Date().toISOString(),
                history_type: 'read'
              }, {
                onConflict: 'user_id,book_id,chapter_number,version_id'
              });
          }
        }
      }
    } catch (error) {
      console.error('Error saving reading history to database:', error);
    }
  };

  // Save current chapter as bookmark
  const saveAsBookmark = async () => {
    if (!user || !selectedBook) {
      toast({
        title: "Kirjautuminen vaaditaan",
        description: "Kirjaudu sisään tallentaaksesi kirjanmerkin",
        variant: "destructive"
      });
      return;
    }

    try {
      // Resolve version code
      const currentVersionCode = bibleVersions.find(v => v.id === selectedVersion)?.code;
      if (!currentVersionCode) {
        toast({
          title: "Versio puuttuu",
          description: "Valitse Raamatun versio ennen kirjanmerkin tallennusta.",
          variant: "destructive"
        });
        return;
      }

      // Tallenna kirjanmerkki palvelimella (hoitaa schema-mäppäyksen)
      const { data: saved, error: saveErr } = await (supabase as any)
        .rpc('save_bookmark', {
          p_user_id: user.id,
          p_book_name: selectedBook,
          p_chapter_number: selectedChapter,
          p_version_code: currentVersionCode,
        });

      if (saveErr) {
        throw saveErr;
      }

      if (!saved?.success) {
        const errMsg = saved?.error || 'Tuntematon virhe';
        if (errMsg === 'Bookmark already exists') {
          toast({
            title: "Kirjanmerkki on jo olemassa",
            description: `${getFinnishBookName(selectedBook)} ${selectedChapter}`,
          });
        } else {
          console.error('save_bookmark failed:', errMsg, saved);
          toast({
            title: "Virhe",
            description: `Kirjanmerkin tallennus epäonnistui: ${errMsg}`,
            variant: "destructive",
          });
        }
        return;
      }
      
      toast({
        title: "Kirjanmerkki tallennettu",
        description: `${getFinnishBookName(selectedBook)} ${selectedChapter}`,
      });
    } catch (error: any) {
      console.error('Error saving bookmark:', error);
      const errText = typeof error?.message === 'string' ? error.message : 'Tuntematon virhe';
      toast({
        title: "Virhe",
        description: `Kirjanmerkin tallennus epäonnistui: ${errText}`,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      const versionsResult = await (supabase as any).schema('bible_schema').from('bible_versions').select('id, name, code').eq('is_active', true).order('name');
      
      if (versionsResult.data) {
        setBibleVersions(versionsResult.data);
        
        // Prefer version from URL (?version=CODE), then localStorage, else first active
        let versionToUse = '';
        const urlParams = new URLSearchParams(window.location.search);
        const versionParam = urlParams.get('version');
        if (versionParam) {
          const matched = versionsResult.data.find(v => v.code.toLowerCase() === versionParam.toLowerCase());
          if (matched) {
            versionToUse = matched.id;
          }
        }
        
        if (!versionToUse) {
          const savedVersion = localStorage.getItem('selectedBibleVersion');
          if (savedVersion && versionsResult.data.find(v => v.id === savedVersion)) {
            versionToUse = savedVersion;
          } else if (versionsResult.data.length > 0) {
            versionToUse = versionsResult.data[0].id;
          }
        }
        
        if (versionToUse) {
          setSelectedVersion(versionToUse);
          localStorage.setItem('selectedBibleVersion', versionToUse);
          // Notify parent of version code
          const versionCode = versionsResult.data.find(v => v.id === versionToUse)?.code;
          if (versionCode && onVersionChange) {
            onVersionChange(versionCode);
          }
        }
      }
    };
    fetchInitialData();
  }, []);

  // Fetch books when version changes
  useEffect(() => {
    const fetchBooksForVersion = async () => {
      if (selectedVersion && bibleVersions.length > 0) {
        const version = bibleVersions.find(v => v.id === selectedVersion);
        if (version) {
          const books = await getBibleBooks(version.code);
          setBibleBooks(books);

          // Only initialize book selection if we don't have a selected book
          // AND we're not in app title navigation
          if (books.length > 0 && !selectedBook && !isAppTitleNavigation && !positionLoading) {
            // Try to use latest reading position first
            if (latestPosition?.bookName) {
              // Find book by Finnish or English name
              const lastReadBook = books.find(b => 
                b.name === getEnglishBookName(latestPosition.bookName) ||
                getFinnishBookName(b.name) === latestPosition.bookName
              );
              if (lastReadBook) {
                setIsFromLatestPosition(true);
                onBookSelect(lastReadBook.name);
                if (latestPosition.chapter) {
                  onChapterSelect(latestPosition.chapter);
                }
                return;
              }
            }
            
            // Fallback to Matthew/Matteus if no latest position
            const matthewBook = books.find(b => 
              b.name.toLowerCase().includes('matt') || 
              b.name.toLowerCase().includes('matias') ||
              b.name === 'Matthew'
            );
            if (matthewBook) {
              onBookSelect(matthewBook.name);
            } else {
              onBookSelect(books[0].name);
            }
          }
        }
      }
    };
    fetchBooksForVersion();
  }, [selectedVersion, bibleVersions, latestPosition, positionLoading]);

  useEffect(() => {
    if (currentView === 'search' && searchQuery) {
      // Search is now handled in Index.tsx
    }
  }, [currentView, searchQuery, selectedVersion]);

  const handleNavigateToVerse = (bookName: string, chapter: number, verse?: number, text?: string) => {
    onNavigateToVerse(bookName, chapter, verse);
    // Also set it as selected verse if verse is specified
    if (verse && text) {
      onVerseSelect(bookName, chapter, verse, text);
    }
    toast({
      title: "Siirretty",
      description: `${getFinnishBookName(bookName)} ${chapter}${verse ? `:${verse}` : ''}`,
    });
  };

  const handlePlaybackToggle = () => {
    if (bibleReaderRef.current) {
      bibleReaderRef.current.togglePlayback();
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'summaries':
        return <UserSummaries />;
      
      case 'highlights':
        return <UserHighlights />;
      
      default:
        const currentVersionCode = bibleVersions.find(v => v.id === selectedVersion)?.code || 'finstlk201';
        return (
          <BibleReader
            book={selectedBook}
            chapter={selectedChapter}
            targetVerse={targetVerse}
            versionCode={currentVersionCode}
            onBookSelect={handleBookSelect}
            onChapterSelect={handleChapterSelect}
            onVerseSelect={onVerseSelect}
            showNextChapterInfo={false}
            isAppTitleNavigation={isAppTitleNavigation}
            onNavigationComplete={onNavigationComplete}
            isFromLatestPosition={isFromLatestPosition}
            ref={bibleReaderRef}
          />
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Fixed Header with Bible location and controls */}
      <div className="bg-card border-b border-border p-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          {/* Bible Location and Version */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {/* Book Selection */}
              <Select value={selectedBook} onValueChange={onBookSelect}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Valitse kirja">
                    {selectedBook ? getFinnishBookName(selectedBook) : "Valitse kirja"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-popover z-50 max-w-[300px]">
                  {bibleBooks.map((book) => (
                    <SelectItem 
                      key={book.name} 
                      value={book.name}
                      className="pl-6 pr-2 text-left"
                    >
                      {getFinnishBookName(book.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Chapter Selection */}
              <Select value={selectedChapter.toString()} onValueChange={(value) => handleChapterSelect(parseInt(value))}>
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {Array.from({ length: bibleBooks.find(b => b.name === selectedBook)?.chapters_count || 0 }, (_, i) => i + 1).map((chapter) => (
                    <SelectItem key={chapter} value={chapter.toString()}>
                      {chapter}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Version Selection */}
              <Select value={selectedVersion} onValueChange={(value) => { 
                setSelectedVersion(value); 
                localStorage.setItem('selectedBibleVersion', value);
                // Notify parent of version code change
                const versionCode = bibleVersions.find(v => v.id === value)?.code;
                if (versionCode && onVersionChange) {
                  onVersionChange(versionCode);
                }
              }}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Versio" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {bibleVersions.map((version) => (
                    <SelectItem key={version.id} value={version.id}>
                      {version.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

           {/* Audio Controls */}
          {currentView === 'bible' && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePlaybackToggle}>
                <Play className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={saveAsBookmark}>
                <Bookmark className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default MainContent;