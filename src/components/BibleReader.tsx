import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, MessageSquare } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getChapterData, ChapterWithVerses, getNextChapter, getPreviousChapter, getBookChapters } from "@/lib/bibleService";
import { getFinnishBookName } from "@/lib/bookNameMapping";
import VerseHighlighter from "./VerseHighlighter";
import InfoBox, { generateNextChapterInfo } from "./InfoBox";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface BibleReaderProps {
  book: string;
  chapter: number;
  targetVerse?: number;
  versionCode?: string;
  onBookSelect: (book: string) => void;
  onChapterSelect: (chapter: number) => void;
  onVerseSelect: (bookName: string, chapter: number, verse: number, text: string) => void;
  showNextChapterInfo?: boolean;
  isAppTitleNavigation?: boolean;
  onNavigationComplete?: () => void;
  isFromLatestPosition?: boolean;
}

const BibleReader = ({ book, chapter, targetVerse, versionCode = 'fin2017', onBookSelect, onChapterSelect, onVerseSelect, showNextChapterInfo = true, isAppTitleNavigation = false, onNavigationComplete, isFromLatestPosition = false }: BibleReaderProps) => {
  console.log('BibleReader render - book:', book, 'chapter:', chapter, 'isAppTitleNavigation:', isAppTitleNavigation);
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVerse, setCurrentVerse] = useState(1);
  const [highlights, setHighlights] = useState<Set<number>>(new Set());
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [chapterData, setChapterData] = useState<ChapterWithVerses | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInfoBox, setShowInfoBox] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasUserNavigated, setHasUserNavigated] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  // Track when props change (indicating navigation)
  useEffect(() => {
    // If book/chapter changed and it's not the first render, user navigated
    if (!isInitialLoad && (book || chapter)) {
      setHasUserNavigated(true);
    }
  }, [book, chapter]);
  // Remove the saveReadingPosition function as it's no longer needed for auto-save
  // Only explicit bookmark saves are done in MainContent.tsx

  useEffect(() => {
    const fetchChapterData = async () => {
      // Skip if we don't have a book yet
      if (!book) return;
      
      console.log('=== FETCH CHAPTER DATA START ===');
      console.log('isInitialLoad:', isInitialLoad, 'isNavigating:', isNavigating, 'isAppTitleNavigation:', isAppTitleNavigation);
      
      setLoading(true);
      const data = await getChapterData(book, chapter, versionCode);
      setChapterData(data);
      
      // Load existing highlights for this chapter if user is logged in
      if (data && user) {
        try {
          const verseIds = data.verses.map(v => v.id);
          const { data: existingHighlights } = await supabase
            .from('highlights')
            .select('verse_id')
            .eq('user_id', user.id)
            .in('verse_id', verseIds);

          if (existingHighlights) {
            const highlightedVerseNumbers = new Set<number>();
            existingHighlights.forEach(highlight => {
              const verse = data.verses.find(v => v.id === highlight.verse_id);
              if (verse) {
                highlightedVerseNumbers.add(verse.verse_number);
              }
            });
            setHighlights(highlightedVerseNumbers);
          }
        } catch (error) {
          console.error('Error loading highlights:', error);
        }
      }
      
      setLoading(false);
      
      // Auto-save is now disabled - only manual bookmarks save positions
      console.log('BibleReader - auto-save disabled'); 
      
      // Mark that initial load is complete
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
      
      // Call navigation complete callback if provided (but delay it slightly to ensure state is stable)
      if (isAppTitleNavigation && onNavigationComplete) {
        console.log('=== APP TITLE NAVIGATION COMPLETE - calling callback ===');
        setTimeout(() => {
          onNavigationComplete();
        }, 100);
      }
      
      // Only show next chapter info if explicitly enabled and not navigating programmatically
      if (data && showNextChapterInfo && !isNavigating && !isAppTitleNavigation) {
        const totalChapters = await getBookChapters(book, versionCode);
        const nextChapterInfo = generateNextChapterInfo(
          book, 
          chapter, 
          totalChapters
        );
        if (nextChapterInfo) {
          setInfoMessage(nextChapterInfo);
          setShowInfoBox(true);
        }
      }
      
      // Reset navigation flag
      setIsNavigating(false);
      console.log('=== FETCH CHAPTER DATA END ===');
    };

    fetchChapterData();
  }, [book, chapter, versionCode, isAppTitleNavigation]);

  // Set current verse when targetVerse changes
  useEffect(() => {
    if (targetVerse && chapterData) {
      setCurrentVerse(targetVerse);
      // Scroll to the verse after a short delay to ensure it's rendered
      setTimeout(() => {
        const verseElement = document.getElementById(`verse-${targetVerse}`);
        if (verseElement) {
          verseElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
    }
  }, [targetVerse, chapterData]);

  const togglePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false);
      // In real app, pause audio
      toast({
        title: "Toisto pysäytetty",
        description: `${getFinnishBookName(book)} ${chapter}`,
      });
    } else {
      setIsPlaying(true);
      // In real app, start audio
      toast({
        title: "Toisto aloitettu",
        description: `${getFinnishBookName(book)} ${chapter}`,
      });
      
      // Simulate verse progression
      setTimeout(() => setIsPlaying(false), 5000);
    }
  };

  const toggleHighlight = async (verseNumber: number) => {
    if (!user) {
      toast({
        title: "Kirjaudu sisään",
        description: "Korostaaksesi jakeita sinun täytyy olla kirjautuneena",
        variant: "destructive"
      });
      return;
    }

    const newHighlights = new Set(highlights);
    
    // Find the verse ID from chapter data
    const verse = chapterData?.verses.find(v => v.verse_number === verseNumber);
    if (!verse) {
      console.error('Verse not found:', verseNumber);
      return;
    }

    try {
      if (newHighlights.has(verseNumber)) {
        // Remove highlight
        newHighlights.delete(verseNumber);
        
        // Delete from database
        const { error } = await supabase
          .from('highlights')
          .delete()
          .eq('verse_id', verse.id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error removing highlight:', error);
          toast({
            title: "Virhe",
            description: "Korostuksen poistaminen epäonnistui",
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Korostus poistettu",
          description: `${getFinnishBookName(book)} ${chapter}:${verseNumber}`,
        });
      } else {
        // Add highlight
        newHighlights.add(verseNumber);
        
        // Save to database
        const { error } = await supabase
          .from('highlights')
          .insert({
            verse_id: verse.id,
            user_id: user.id,
            color: '#FFFF00' // Default yellow highlight
          });

        if (error) {
          console.error('Error saving highlight:', error);
          toast({
            title: "Virhe", 
            description: "Korostuksen tallentaminen epäonnistui",
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Jae korostettu",
          description: `${getFinnishBookName(book)} ${chapter}:${verseNumber}`,
        });
      }
      
      setHighlights(newHighlights);
    } catch (error) {
      console.error('Error toggling highlight:', error);
      toast({
        title: "Virhe",
        description: "Korostuksen käsitteleminen epäonnistui",
        variant: "destructive"
      });
    }
  };

  const toggleBookmark = () => {
    const bookmarkKey = `${book}_${chapter}`;
    const newBookmarks = new Set(bookmarks);
    
    if (newBookmarks.has(bookmarkKey)) {
      newBookmarks.delete(bookmarkKey);
      toast({
        title: "Kirjanmerkki poistettu",
        description: `${getFinnishBookName(book)} ${chapter}`,
      });
    } else {
      newBookmarks.add(bookmarkKey);
      toast({
        title: "Kirjanmerkki lisätty",
        description: `${getFinnishBookName(book)} ${chapter}`,
      });
    }
    setBookmarks(newBookmarks);
  };

  const navigateChapter = async (direction: 'prev' | 'next') => {
    try {
      let navigationData;
      
      if (direction === 'next') {
        navigationData = await getNextChapter(book, chapter, versionCode);
      } else {
        navigationData = await getPreviousChapter(book, chapter, versionCode);
      }
      
      if (navigationData) {
        // Don't auto-save position when navigating
        
        setIsNavigating(true);
        setHasUserNavigated(true);
        
        onBookSelect(navigationData.book);
        onChapterSelect(navigationData.chapter);
        toast({
          title: direction === 'prev' ? "Edellinen luku" : "Seuraava luku",
          description: `${getFinnishBookName(navigationData.book)} ${navigationData.chapter}`,
        });
      } else {
        toast({
          title: "Ei voida siirtyä",
          description: direction === 'prev' ? "Tämä on ensimmäinen luku" : "Tämä on viimeinen luku",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Navigation error:', error);
      toast({
        title: "Navigointivirhe",
        description: "Luvun vaihtaminen epäonnistui",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{getFinnishBookName(book)}</h1>
          <h2 className="text-xl text-muted-foreground">Luku {chapter}</h2>
        </div>
        <Card className="p-6">
          <div className="text-center text-muted-foreground">Ladataan...</div>
        </Card>
      </div>
    );
  }

  if (!chapterData) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{getFinnishBookName(book)}</h1>
          <h2 className="text-xl text-muted-foreground">Luku {chapter}</h2>
        </div>
        <Card className="p-6">
          <div className="text-center text-muted-foreground">Lukua ei löytynyt</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Chapter Header with Navigation */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => navigateChapter('prev')}
          className="flex items-center gap-2"
        >
          <SkipBack className="h-4 w-4" />
          Edellinen luku
        </Button>
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{getFinnishBookName(book)}</h1>
          <h2 className="text-xl text-muted-foreground">Luku {chapter}</h2>
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => navigateChapter('next')}
          className="flex items-center gap-2"
        >
          Seuraava luku
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>



      {/* Bible Text */}
      <Card className="p-6">
        <div className="space-y-4 leading-relaxed text-lg">
          {chapterData.verses.map((verse) => (
            <VerseHighlighter
              key={verse.verse_number}
              verse={{ number: verse.verse_number, text: verse.text }}
              isHighlighted={highlights.has(verse.verse_number)}
              isCurrentVerse={currentVerse === verse.verse_number}
              onHighlight={() => toggleHighlight(verse.verse_number)}
              onVerseClick={() => {
                setCurrentVerse(verse.verse_number);
                onVerseSelect(book, chapter, verse.verse_number, verse.text);
              }}
              book={book}
              chapter={chapter}
            />
          ))}
        </div>
      </Card>

      {/* Chapter Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => navigateChapter('prev')}
          className="flex items-center gap-2"
        >
          <SkipBack className="h-4 w-4" />
          Edellinen luku
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => navigateChapter('next')}
          className="flex items-center gap-2"
        >
          Seuraava luku
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Hidden audio element for future implementation */}
      <audio ref={audioRef} style={{ display: 'none' }} />
      
      {/* Info Box */}
      {showInfoBox && (
        <InfoBox
          message={infoMessage}
          onClose={() => setShowInfoBox(false)}
        />
      )}
    </div>
  );
};

export default BibleReader;