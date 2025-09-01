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
}

const BibleReader = ({ book, chapter, targetVerse, versionCode = 'fin2017', onBookSelect, onChapterSelect, onVerseSelect, showNextChapterInfo = true }: BibleReaderProps) => {
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
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  // Function to save reading position to localStorage and database
  const saveReadingPosition = async (bookName: string, chapterNum: number, version: string) => {
    const currentPosition = {
      book: bookName,
      chapter: chapterNum,
      bookName: getFinnishBookName(bookName),
      versionCode: version,
      timestamp: Date.now()
    };
    localStorage.setItem('lastReadingPosition', JSON.stringify(currentPosition));
    console.log('Saved reading position:', currentPosition);

    // Also save to database if user is authenticated
    if (user) {
      try {
        // First get the version ID
        const { data: versionData } = await supabase
          .from('bible_versions')
          .select('id')
          .eq('code', version)
          .single();

        if (versionData) {
          // Then get the book data
          const { data: bookData } = await supabase
            .from('books')
            .select('id')
            .eq('name', bookName)
            .eq('version_id', versionData.id)
            .single();

          if (bookData) {
            // Save to user_reading_history
            await supabase
              .from('user_reading_history')
              .upsert({
                user_id: user.id,
                book_id: bookData.id,
                version_id: versionData.id,
                chapter_number: chapterNum,
                verse_number: 1, // Default to verse 1
                last_read_at: new Date().toISOString(),
                history_type: 'read'
              });
          }
        }
      } catch (error) {
        console.error('Error saving reading history to database:', error);
      }
    }
  };

  useEffect(() => {
    const fetchChapterData = async () => {
      setLoading(true);
      const data = await getChapterData(book, chapter, versionCode);
      setChapterData(data);
      setLoading(false);
      
      // Only save reading position if it's not the initial load or if user is intentionally navigating
      if (data && (!isInitialLoad || isNavigating)) {
        await saveReadingPosition(book, chapter, versionCode);
      }
      
      // Mark that initial load is complete
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
      
      // Only show next chapter info if explicitly enabled and not navigating programmatically
      if (data && showNextChapterInfo && !isNavigating) {
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
    };

    fetchChapterData();
  }, [book, chapter, versionCode]);

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

  const toggleHighlight = (verseNumber: number) => {
    const newHighlights = new Set(highlights);
    if (newHighlights.has(verseNumber)) {
      newHighlights.delete(verseNumber);
      toast({
        title: "Korostus poistettu",
        description: `${getFinnishBookName(book)} ${chapter}:${verseNumber}`,
      });
    } else {
      newHighlights.add(verseNumber);
      toast({
        title: "Jae korostettu",
        description: `${getFinnishBookName(book)} ${chapter}:${verseNumber}`,
      });
    }
    setHighlights(newHighlights);
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
        setIsNavigating(true);
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