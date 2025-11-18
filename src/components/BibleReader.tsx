import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, MessageSquare, Database, Sparkles, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getChapterData, ChapterWithVerses, getNextChapter, getPreviousChapter, getBookChapters } from "@/lib/bibleService";
import { getFinnishBookName } from "@/lib/bookNameMapping";
import VerseHighlighter from "./VerseHighlighter";
import InfoBox, { generateNextChapterInfo } from "./InfoBox";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { generateChapterAudio } from "@/lib/audioService";
import { getChapterEstimatedTime, formatListeningTime } from "@/lib/audioEstimation";

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
  onPlaybackStateChange?: (isPlaying: boolean) => void;
  onLoadingStateChange?: (isLoading: boolean) => void;
  shouldAutoplay?: boolean;
  onListeningPositionSaved?: (bookName: string, chapter: number, verse: number, versionCode: string) => void;
}

export interface BibleReaderHandle {
  togglePlayback: () => void;
  isPlaying: boolean;
}

const BibleReader = forwardRef<BibleReaderHandle, BibleReaderProps>(({ book, chapter, targetVerse, versionCode = 'finstlk201', readerKey, onBookSelect, onChapterSelect, onVerseSelect, showNextChapterInfo = true, isAppTitleNavigation = false, onNavigationComplete, isFromLatestPosition = false, onPlaybackStateChange, onLoadingStateChange, shouldAutoplay = false, onListeningPositionSaved }, ref) => {
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
  const [audioFromCache, setAudioFromCache] = useState<boolean | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
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
  }), [isPlaying, book, chapter, readerKey]);

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

  // Autoplay effect - start playback automatically when shouldAutoplay is true
  // Use a ref to track if autoplay has already been triggered to prevent multiple calls
  const autoplayTriggeredRef = useRef(false);
  
  useEffect(() => {
    const attemptAutoplay = async () => {
      // Check if we should autoplay and chapter data is loaded
      if (shouldAutoplay && chapterData && readerKey && !loading && !isPlaying && !autoplayTriggeredRef.current) {
        console.log('Autoplay triggered - starting playback automatically');
        autoplayTriggeredRef.current = true;
        // Small delay to ensure everything is rendered
        setTimeout(() => {
          togglePlayback();
        }, 500);
      }
    };

    attemptAutoplay();
  }, [shouldAutoplay, chapterData, readerKey, loading]);
  
  // Reset autoplay trigger when book/chapter changes
  useEffect(() => {
    autoplayTriggeredRef.current = false;
  }, [book, chapter]);

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
    console.log('togglePlayback invoked with', { book, chapter, readerKey });
    // Check if book is selected
    if (!book || book.trim() === '') {
      toast({
        title: "Virhe",
        description: "Valitse ensin Raamatun kirja",
        variant: "destructive"
      });
      return;
    }

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
      // Pause audio and save listening position
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      onPlaybackStateChange?.(false);
      
      // Save the listening position when paused
      if (user && chapterData) {
        console.log('=== ATTEMPTING TO SAVE LISTENING POSITION ===');
        console.log('User:', user?.id);
        console.log('Current verse:', currentVerse);
        console.log('Book:', book, 'Chapter:', chapter);
        
        // Determine the most accurate verse at pause time using current audio time
        let verseNumberToSave = currentVerse;
        if (audioRef.current && audioCues.length > 0) {
          const nowMs = audioRef.current.currentTime * 1000;
          const cueNow = audioCues.find(c => nowMs >= c.start_ms && nowMs < c.end_ms);
          if (cueNow) {
            verseNumberToSave = cueNow.verse_number;
          }
        }
        const verseData = chapterData.verses.find(v => v.verse_number === verseNumberToSave);
        if (verseData) {
          console.log('Current verse data found:', verseData.id);
          // Fetch book_id and version_id
          (async () => {
            try {
              console.log('Fetching version data for code:', versionCode);
              const { data: versionData, error: versionError } = await (supabase as any)
                .schema('bible_schema')
                .from('bible_versions')
                .select('id')
                .eq('code', versionCode)
                .single();
              
              if (versionError) {
                console.error('Error fetching version:', versionError);
                return;
              }
              
              if (!versionData) {
                console.error('Version not found');
                return;
              }
              
              console.log('Version data:', versionData);

              console.log('Fetching book data for book:', book);
              const { data: bookData, error: bookError } = await (supabase as any)
                .schema('bible_schema')
                .from('books')
                .select('id')
                .eq('name', book)
                .eq('version_id', versionData.id)
                .single();
              
              if (bookError) {
                console.error('Error fetching book:', bookError);
                return;
              }
              
              if (!bookData) {
                console.error('Book not found');
                return;
              }
              
              console.log('Book data:', bookData);

              console.log('Fetching chapter data');
              const { data: chapterDbData, error: chapterError } = await (supabase as any)
                .schema('bible_schema')
                .from('chapters')
                .select('id')
                .eq('book_id', bookData.id)
                .eq('chapter_number', chapter)
                .single();
              
              if (chapterError) {
                console.error('Error fetching chapter:', chapterError);
                return;
              }
              
              console.log('Chapter data:', chapterDbData);

              const historyData = {
                user_id: user.id,
                book_id: bookData.id,
                chapter_id: chapterDbData?.id,
                chapter_number: chapter,
                verse_number: verseNumberToSave,
                verse_id: verseData.id,
                version_id: versionData.id,
                history_type: 'listen' as const,
                last_read_at: new Date().toISOString()
              };
              
              console.log('Saving listening position (update-or-insert):', historyData);

              // Update latest record if exists, else insert new
              const { data: existing, error: existingError } = await supabase
                .from('user_reading_history')
                .select('id')
                .eq('user_id', user.id)
                .eq('version_id', versionData.id)
                .eq('history_type', 'listen')
                .order('last_read_at', { ascending: false })
                .limit(1);

              if (existingError) {
                console.error('Error checking existing listening position:', existingError);
              }

              let saveError = null as any;
              if (existing && existing.length > 0) {
                const { error: updateError } = await supabase
                  .from('user_reading_history')
                  .update({
                    book_id: bookData.id,
                    chapter_id: chapterDbData?.id,
                    chapter_number: chapter,
                    verse_number: verseNumberToSave,
                    verse_id: verseData.id,
                    last_read_at: new Date().toISOString(),
                  })
                  .eq('id', existing[0].id);
                saveError = updateError;
              } else {
                const { error: insertError } = await supabase
                  .from('user_reading_history')
                  .insert([historyData]);
                saveError = insertError;
              }

              if (saveError) {
                console.error('Error saving listening position:', saveError);
              } else {
                console.log('Listening position saved successfully');
                // Notify parent that position was saved
                onListeningPositionSaved?.(book, chapter, verseNumberToSave, versionCode);
              }
            } catch (error) {
              console.error('Error saving listening position:', error);
            }
          })();
        } else {
          console.log('Current verse data NOT found for verse:', verseNumberToSave);
        }
      }
      
      // Show exact verse at pause time
      const nowMs = audioRef.current ? audioRef.current.currentTime * 1000 : 0;
      const cueNow = audioCues.find(c => nowMs >= c.start_ms && nowMs < c.end_ms);
      const verseForToast = cueNow?.verse_number ?? currentVerse;
      toast({
        title: "Toisto pysäytetty",
        description: `${getFinnishBookName(book)} ${chapter}:${verseForToast}`,
      });
    } else {
      // Start audio
      try {
        setIsLoadingAudio(true);
        onLoadingStateChange?.(true);
        
        // Generate or fetch audio if not already loaded
        let currentAudioCues = audioCues;
        if (!audioUrl) {
          toast({
            title: "Ladataan ääntä...",
            description: `${getFinnishBookName(book)} ${chapter}`,
          });
          
          const audioData = await generateChapterAudio(book, chapter, versionCode, readerKey);
          setAudioUrl(audioData.file_url);
          setAudioFromCache(audioData.from_cache ?? null);
          
          // Audio cues now include verse_number from the API
          if (audioData.audio_cues) {
            currentAudioCues = audioData.audio_cues;
            setAudioCues(audioData.audio_cues);
            // Activate verse highlighting from verse 1 if no target verse
            if (!targetVerse && audioData.audio_cues.length > 0) {
              setCurrentVerse(1);
            }
          }
          
          // Wait for audio element to be ready
          if (audioRef.current) {
            audioRef.current.src = audioData.file_url;
            audioRef.current.load();
          }
        } else {
          // Audio already loaded, ensure verse highlighting is active
          if (!targetVerse && currentVerse === 0) {
            setCurrentVerse(1);
          }
        }
        
        // If targetVerse is set, seek to that verse and activate highlighting
        // Use currentAudioCues which contains the just-loaded data
        if (targetVerse && currentAudioCues.length > 0 && audioRef.current) {
          const cue = currentAudioCues.find(c => c.verse_number === targetVerse);
          if (cue) {
            console.log('Seeking to target verse:', targetVerse, 'at time:', cue.start_ms / 1000);
            audioRef.current.currentTime = cue.start_ms / 1000;
            setCurrentVerse(targetVerse);
          }
        }
        
        // Play audio
        if (audioRef.current) {
          await audioRef.current.play();
          setIsPlaying(true);
          onPlaybackStateChange?.(true);
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
        onLoadingStateChange?.(false);
      }
    }
  };

  // Handle audio ended event and time updates
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = async () => {
      setIsPlaying(false);
      onPlaybackStateChange?.(false);
      
      // Try to navigate to next chapter and continue playback
      try {
        const nextChapterData = await getNextChapter(book, chapter, versionCode);
        
        if (nextChapterData) {
          setIsNavigating(true);
          setHasUserNavigated(true);
          
          // Reset verse highlighting to start of chapter
          setCurrentVerse(1);
          
          onBookSelect(nextChapterData.book);
          onChapterSelect(nextChapterData.chapter);
          
          toast({
            title: "Siirtyminen seuraavaan lukuun",
            description: `${getFinnishBookName(nextChapterData.book)} ${nextChapterData.chapter}`,
          });
          
          // Load audio for next chapter and start playback automatically
          // We need to use nextChapterData values directly since state hasn't updated yet
          if (readerKey) {
            setTimeout(async () => {
              try {
                setIsLoadingAudio(true);
                onLoadingStateChange?.(true);
                
                const audioData = await generateChapterAudio(
                  nextChapterData.book, 
                  nextChapterData.chapter, 
                  versionCode, 
                  readerKey
                );
                
                setAudioUrl(audioData.file_url);
                setAudioFromCache(audioData.from_cache ?? null);
                
                if (audioData.audio_cues) {
                  setAudioCues(audioData.audio_cues);
                  setCurrentVerse(1);
                }
                
                // Set audio source and play
                if (audioRef.current) {
                  audioRef.current.src = audioData.file_url;
                  audioRef.current.load();
                  await audioRef.current.play();
                  setIsPlaying(true);
                  onPlaybackStateChange?.(true);
                }
                
                setIsLoadingAudio(false);
                onLoadingStateChange?.(false);
              } catch (error) {
                console.error('Error loading next chapter audio:', error);
                setIsLoadingAudio(false);
                onLoadingStateChange?.(false);
                toast({
                  title: "Virhe",
                  description: "Seuraavan luvun audion lataaminen epäonnistui",
                  variant: "destructive"
                });
              }
            }, 1500);
          }
        } else {
          toast({
            title: "Luku päättyi",
            description: "Tämä oli viimeinen luku",
          });
        }
      } catch (error) {
        console.error('Error navigating to next chapter:', error);
        toast({
          title: "Luku päättyi",
          description: "Automaattinen siirtyminen seuraavaan lukuun epäonnistui",
          variant: "destructive"
        });
      }
    };

    const handleError = (e: Event) => {
      console.error('Audio playback error:', e);
      setIsPlaying(false);
      onPlaybackStateChange?.(false);
      toast({
        title: "Virhe",
        description: "Äänen toistamisessa tapahtui virhe",
        variant: "destructive"
      });
    };

    const handleTimeUpdate = () => {
      if (audioCues.length === 0) {
        console.log('handleTimeUpdate: No audio cues available');
        return;
      }
      
      const currentTimeMs = audio.currentTime * 1000;
      
      // Update progress
      if (audio.duration) {
        setAudioProgress((audio.currentTime / audio.duration) * 100);
        setAudioCurrentTime(audio.currentTime);
      }
      
      const currentCue = audioCues.find(
        cue => currentTimeMs >= cue.start_ms && currentTimeMs < cue.end_ms
      );
      
      if (currentCue) {
        console.log('Current cue found:', currentCue.verse_number, 'Current verse state:', currentVerse);
        if (currentCue.verse_number !== currentVerse) {
          console.log('Updating current verse to:', currentCue.verse_number);
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
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration) {
        setAudioDuration(audio.duration);
      }
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [toast, audioCues, currentVerse]);

  // Reset audio when chapter or voice changes
  useEffect(() => {
    setAudioUrl(null);
    setAudioCues([]);
    setIsPlaying(false);
    setAudioProgress(0);
    setAudioDuration(0);
    setAudioCurrentTime(0);
    onPlaybackStateChange?.(false);
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

  const playFromVerse = async (verseNumber: number) => {
    try {
      // First, ensure audio is loaded
      if (!audioUrl || !readerKey) {
        // Load audio if not already loaded
        setIsLoadingAudio(true);
        onLoadingStateChange?.(true);
        
        toast({
          title: "Ladataan ääntä...",
          description: `${getFinnishBookName(book)} ${chapter}`,
        });
        
        const audioData = await generateChapterAudio(book, chapter, versionCode, readerKey);
        setAudioUrl(audioData.file_url);
        
        // Audio cues now include verse_number from the API
        if (audioData.audio_cues) {
          setAudioCues(audioData.audio_cues);
          
          // Now seek and play
          if (audioRef.current) {
            audioRef.current.src = audioData.file_url;
            audioRef.current.load();
            
            // Wait for metadata to load
            audioRef.current.onloadedmetadata = () => {
              const cue = audioData.audio_cues.find(c => c.verse_number === verseNumber);
              if (cue && audioRef.current) {
                audioRef.current.currentTime = cue.start_ms / 1000;
                audioRef.current.play().then(() => {
                  setIsPlaying(true);
                  onPlaybackStateChange?.(true);
                  toast({
                    title: "Toisto aloitettu",
                    description: `${getFinnishBookName(book)} ${chapter}:${verseNumber}`,
                  });
                }).catch(error => {
                  console.error('Error playing audio:', error);
                  toast({
                    title: "Virhe",
                    description: "Äänen toistaminen epäonnistui",
                    variant: "destructive"
                  });
                });
              }
            };
          }
        }
        
        setIsLoadingAudio(false);
        onLoadingStateChange?.(false);
      } else {
        // Audio already loaded, just seek and play
        if (audioCues.length > 0 && audioRef.current) {
          const cue = audioCues.find(c => c.verse_number === verseNumber);
          if (cue) {
            audioRef.current.currentTime = cue.start_ms / 1000;
            
            if (!isPlaying) {
              await audioRef.current.play();
              setIsPlaying(true);
              onPlaybackStateChange?.(true);
            }
            
            toast({
              title: "Toisto aloitettu",
              description: `${getFinnishBookName(book)} ${chapter}:${verseNumber}`,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error playing from verse:', error);
      toast({
        title: "Virhe",
        description: "Toiston aloittaminen epäonnistui",
        variant: "destructive"
      });
      setIsLoadingAudio(false);
      onLoadingStateChange?.(false);
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
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-bold text-foreground">{getFinnishBookName(book)}</h1>
            {audioFromCache !== null && readerKey && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted/50 cursor-help">
                      {audioFromCache ? (
                        <Database className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{audioFromCache ? 'Audio ladattu välimuistista' : 'Audio generoitu uutena'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <h2 className="text-xl text-muted-foreground">Luku {chapter}</h2>
          {readerKey && chapterData?.verses && (
            <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Arvioitu kuunteluaika: {getChapterEstimatedTime(chapterData.verses)}</span>
            </div>
          )}
          
          {/* Audio Progress Bar */}
          {readerKey && audioUrl && (
            <div className="mt-4 space-y-2 max-w-md mx-auto">
              <Progress value={audioProgress} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatListeningTime(Math.floor(audioCurrentTime))}</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Jäljellä: {formatListeningTime(Math.floor(audioDuration - audioCurrentTime))}
                </span>
                <span>{formatListeningTime(Math.floor(audioDuration))}</span>
              </div>
            </div>
          )}
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
                
                // Start playback from clicked verse if readerKey is available
                if (readerKey) {
                  playFromVerse(verse.verse_number);
                }
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