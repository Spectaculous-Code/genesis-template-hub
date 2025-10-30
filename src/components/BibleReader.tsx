import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
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
import { generateChapterAudio } from "@/lib/audioService";

interface BibleReaderProps {
  book: string;
  chapter: number;
  targetVerse?: number;
  versionCode?: string;
  readerKey?: string; // Optional - if undefined, audio is disabled
  onBookSelect: (book: string) => void;
  onChapterSelect: (chapter: number) => void;
  onVerseSelect: (bookName: string, chapter: number, verse: number, text: string) => void;
  showNextChapterInfo?: boolean;
  isAppTitleNavigation?: boolean;
  onNavigationComplete?: () => void;
  isFromLatestPosition?: boolean;
}

export interface BibleReaderHandle {
  togglePlayback: () => void;
  isPlaying: boolean;
}

const BibleReader = forwardRef<BibleReaderHandle, BibleReaderProps>(({ book, chapter, targetVerse, versionCode = 'finstlk201', readerKey, onBookSelect, onChapterSelect, onVerseSelect, showNextChapterInfo = true, isAppTitleNavigation = false, onNavigationComplete, isFromLatestPosition = false }, ref) => {
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
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioCues, setAudioCues] = useState<Array<{verse_id: string; verse_number: number; start_ms: number; end_ms: number}>>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  // Track when props change (indicating navigation)
  useEffect(() => {
    // If book/chapter changed and it's not the first render, user navigated
    if (!isInitialLoad && (book || chapter)) {
      setHasUserNavigated(true);
    }
  }, [book, chapter]);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    togglePlayback,
    isPlaying
  }), [isPlaying]);

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

  const togglePlayback = async () => {
    // Check if audio is disabled for this version
    if (!readerKey) {
      toast({
        title: "Ääntä ei ole valittu tälle versiolle",
        description: "Mene profiilisivulle valitsemaan ääni (Venla tai Urho) tälle Raamatun versiolle, tai vaihda toiseen Raamatun versioon, jolle ääni on valittu.",
        variant: "destructive",
        duration: 6000
      });
      return;
    }

    if (isPlaying) {
      // Pause audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      toast({
        title: "Toisto pysäytetty",
        description: `${getFinnishBookName(book)} ${chapter}`,
      });
    } else {
      // Start audio
      try {
        setIsLoadingAudio(true);
        
        // Generate or fetch audio if not already loaded
        if (!audioUrl) {
          toast({
            title: "Ladataan ääntä...",
            description: `${getFinnishBookName(book)} ${chapter}`,
          });
          
          const audioData = await generateChapterAudio(book, chapter, versionCode, readerKey);
          setAudioUrl(audioData.file_url);
          
          // Map audio cues to include verse numbers
          if (audioData.audio_cues && chapterData) {
            const cuesWithVerseNumbers = audioData.audio_cues.map(cue => {
              const verse = chapterData.verses.find(v => v.id === cue.verse_id);
              return {
                ...cue,
                verse_number: verse?.verse_number || 0
              };
            });
            setAudioCues(cuesWithVerseNumbers);
          }
          
          // Wait for audio element to be ready
          if (audioRef.current) {
            audioRef.current.src = audioData.file_url;
            audioRef.current.load();
          }
        }
        
        // If targetVerse is set, seek to that verse
        if (targetVerse && audioCues.length > 0 && audioRef.current) {
          const cue = audioCues.find(c => c.verse_number === targetVerse);
          if (cue) {
            audioRef.current.currentTime = cue.start_ms / 1000;
          }
        }
        
        // Play audio
        if (audioRef.current) {
          await audioRef.current.play();
          setIsPlaying(true);
          toast({
            title: "Toisto aloitettu",
            description: `${getFinnishBookName(book)} ${chapter}`,
          });
        }
      } catch (error) {
        console.error('Error playing audio:', error);
        toast({
          title: "Virhe",
          description: "Äänen toistaminen epäonnistui. Yritä uudelleen.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingAudio(false);
      }
    }
  };

  // Handle audio ended event and time updates
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleError = (e: Event) => {
      console.error('Audio playback error:', e);
      setIsPlaying(false);
      toast({
        title: "Virhe",
        description: "Äänen toistamisessa tapahtui virhe",
        variant: "destructive"
      });
    };

    const handleTimeUpdate = () => {
      if (audioCues.length === 0) return;
      
      const currentTimeMs = audio.currentTime * 1000;
      const currentCue = audioCues.find(
        cue => currentTimeMs >= cue.start_ms && currentTimeMs < cue.end_ms
      );
      
      if (currentCue && currentCue.verse_number !== currentVerse) {
        setCurrentVerse(currentCue.verse_number);
        
        // Auto-scroll to current verse
        const verseElement = document.getElementById(`verse-${currentCue.verse_number}`);
        if (verseElement) {
          verseElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [toast, audioCues, currentVerse]);

  // Reset audio when chapter or voice changes
  useEffect(() => {
    setAudioUrl(null);
    setAudioCues([]);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  }, [book, chapter, versionCode, readerKey]);

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
    if (!verse || !verse.id) {
      console.error('Verse or verse.id not found:', verseNumber, verse);
      toast({
        title: "Virhe",
        description: "Jakeen tietojen hakeminen epäonnistui",
        variant: "destructive"
      });
      return;
    }

    console.log('Toggling highlight for verse:', verseNumber, 'verse_id:', verse.id, 'user_id:', user.id);

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
        const { data, error } = await supabase
          .from('highlights')
          .insert({
            verse_id: verse.id,
            user_id: user.id,
            color: '#FFFF00' // Default yellow highlight
          })
          .select();

        if (error) {
          console.error('Error saving highlight:', error, 'Data:', { verse_id: verse.id, user_id: user.id });
          toast({
            title: "Virhe", 
            description: `Korostuksen tallentaminen epäonnistui: ${error.message}`,
            variant: "destructive"
          });
          return;
        }

        console.log('Highlight saved successfully:', data);
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

  const toggleBookmark = async () => {
    if (!user) {
      toast({
        title: "Kirjaudu sisään",
        description: "Kirjanmerkkien lisäämiseen sinun täytyy olla kirjautuneena",
        variant: "destructive"
      });
      return;
    }

    if (!chapterData) return;

    const bookmarkKey = `${book}_${chapter}`;
    const newBookmarks = new Set(bookmarks);
    
    try {
      // Get OSIS for the first verse of this chapter
      const { data: chapterVerses, error: chapterErr } = await (supabase as any)
        .rpc('get_verses_by_ref', {
          p_ref_book: book,
          p_chapter: chapter,
          p_verses: [1],
          p_version_code: versionCode,
          p_language_code: 'fi'
        });

      if (chapterErr || !Array.isArray(chapterVerses) || chapterVerses.length === 0) {
        toast({
          title: "Virhe",
          description: "Luvun tietojen hakeminen epäonnistui",
          variant: "destructive"
        });
        return;
      }

      const osisFirst: string = chapterVerses[0].osis;

      // Map OSIS to public verse_id
      const { data: mapped, error: mapErr } = await (supabase as any)
        .rpc('map_osis_to_verse_ids', {
          p_version_code: versionCode,
          p_osis: [osisFirst]
        });

      if (mapErr || !Array.isArray(mapped) || mapped.length === 0) {
        toast({
          title: "Virhe",
          description: "Jaetunnisteen hakeminen epäonnistui",
          variant: "destructive"
        });
        return;
      }

      const publicVerseId = mapped[0].verse_id as string;

      // Resolve chapter_id from public.verses
      const { data: verseRow, error: verseErr } = await supabase
        .from('verses')
        .select('chapter_id')
        .eq('id', publicVerseId)
        .maybeSingle();

      if (verseErr || !verseRow) {
        toast({
          title: "Virhe",
          description: "Luvun tunnisteen hakeminen epäonnistui",
          variant: "destructive"
        });
        return;
      }

      const publicChapterId = verseRow.chapter_id as string;

      if (newBookmarks.has(bookmarkKey)) {
        // Remove bookmark
        newBookmarks.delete(bookmarkKey);

        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('chapter_id', publicChapterId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error removing bookmark:', error);
          toast({
            title: "Virhe",
            description: "Kirjanmerkin poistaminen epäonnistui",
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Kirjanmerkki poistettu",
          description: `${getFinnishBookName(book)} ${chapter}`,
        });
      } else {
        // Add bookmark (store both chapter_id and first verse_id for display)
        newBookmarks.add(bookmarkKey);

        const { error } = await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            chapter_id: publicChapterId,
            verse_id: publicVerseId,
            osis: osisFirst
          });

        if (error) {
          console.error('Error saving bookmark:', error);
          toast({
            title: "Virhe",
            description: `Kirjanmerkin tallentaminen epäonnistui: ${error.message}`,
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Kirjanmerkki lisätty",
          description: `${getFinnishBookName(book)} ${chapter}`,
        });
      }
      
      setBookmarks(newBookmarks);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast({
        title: "Virhe",
        description: "Kirjanmerkin käsitteleminen epäonnistui",
        variant: "destructive"
      });
    }
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

      {/* Audio element for playback */}
      <audio 
        ref={audioRef} 
        style={{ display: 'none' }}
        preload="none"
      />
      
      {/* Info Box */}
      {showInfoBox && (
        <InfoBox
          message={infoMessage}
          onClose={() => setShowInfoBox(false)}
        />
      )}
    </div>
  );
});

BibleReader.displayName = 'BibleReader';

export default BibleReader;