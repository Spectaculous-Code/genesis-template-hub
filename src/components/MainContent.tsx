import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, SkipBack, SkipForward, Volume2, Bookmark, Settings, Loader2, Clock, ChevronLeft, ChevronRight, Database, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { getChapterEstimatedTime, formatListeningTime } from "@/lib/audioEstimation";
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
import { getVoiceById, getVoiceReaderKey } from "@/lib/elevenLabsVoices";
import { useVoicePreferences } from "@/hooks/useVoicePreferences";
import { NO_AUDIO_VOICE_ID, VERSION_ALLOWED_VOICES } from "@/lib/versionVoices";

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
  shouldAutoplay?: boolean;
  onListeningPositionSaved?: (bookName: string, chapter: number, verse: number, versionCode: string) => void;
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
  onVersionChange,
  shouldAutoplay = false,
  onListeningPositionSaved
}: MainContentProps) => {
  console.log('MainContent render - isAppTitleNavigation:', isAppTitleNavigation);
  const [bibleBooks, setBibleBooks] = useState<BibleBook[]>([]);
  const [bibleVersions, setBibleVersions] = useState<BibleVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [isFromLatestPosition, setIsFromLatestPosition] = useState(false);
  const [hasManuallyNavigated, setHasManuallyNavigated] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [chapterVersesCount, setChapterVersesCount] = useState(0);
  const [audioFromCache, setAudioFromCache] = useState<boolean | null>(null);
  const bibleReaderRef = useRef<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { latestPosition, loading: positionLoading, refetch: refetchLatestPosition } = useLatestReadingPosition();
  const { getVoiceForVersion } = useVoicePreferences();
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
            // Save to user_reading_history (update latest or insert)
            const history = {
              user_id: user.id,
              book_id: bookData.id,
              chapter_id: chapterData.id,
              version_id: versionData.id,
              chapter_number: chapterNum,
              verse_number: 1, // Default to verse 1
              last_read_at: new Date().toISOString(),
              history_type: 'read' as const
            };

            const { data: existing, error: existingError } = await supabase
              .from('user_reading_history')
              .select('id')
              .eq('user_id', user.id)
              .eq('history_type', 'read')
              .order('last_read_at', { ascending: false })
              .limit(1);

            if (existingError) {
              console.error('Error checking existing reading position:', existingError);
            }

            if (existing && existing.length > 0) {
              await supabase
                .from('user_reading_history')
                .update({
                  book_id: history.book_id,
                  chapter_id: history.chapter_id,
                  version_id: history.version_id,
                  chapter_number: history.chapter_number,
                  verse_number: history.verse_number,
                  last_read_at: history.last_read_at
                })
                .eq('id', existing[0].id);
            } else {
              await supabase
                .from('user_reading_history')
                .insert([history]);
            }
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

          // Check if URL params are present - if so, skip auto-initialization
          const urlParams = new URLSearchParams(window.location.search);
          const hasUrlBook = urlParams.has('book');
          const hasUrlChapter = urlParams.has('chapter');

          // Only initialize book selection if we don't have a selected book
          // AND we're not in app title navigation
          // AND URL params are not present (to avoid overriding URL navigation)
          if (books.length > 0 && !selectedBook && !isAppTitleNavigation && !positionLoading && !hasUrlBook && !hasUrlChapter) {
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
      // State will be updated via onPlaybackStateChange callback
    }
  };

  const handleNextVerse = () => {
    if (bibleReaderRef.current) {
      bibleReaderRef.current.seekToNextVerse();
    }
  };

  const handlePreviousVerse = () => {
    if (bibleReaderRef.current) {
      bibleReaderRef.current.seekToPreviousVerse();
    }
  };

  const handleGoToVoiceSettings = () => {
    navigate('/profile');
  };

  const handleAudioProgressChange = (progress: number, currentTime: number, duration: number) => {
    setAudioProgress(progress);
    setAudioCurrentTime(currentTime);
    setAudioDuration(duration);
  };

  const handleChapterDataChange = (versesCount: number) => {
    setChapterVersesCount(versesCount);
  };

  const handleAudioCacheStatusChange = (fromCache: boolean | null) => {
    setAudioFromCache(fromCache);
  };

  // Calculate current voice ID for audio controls
  const currentVersionCode = bibleVersions.find(v => v.id === selectedVersion)?.code || 'finstlk201';
  const currentVoiceId = getVoiceForVersion(selectedVersion, currentVersionCode);
  const hasAudioEnabled = currentVoiceId && currentVoiceId !== NO_AUDIO_VOICE_ID;
  
  // Check if version supports audio at all
  const versionSupportsAudio = () => {
    const allowedVoices = VERSION_ALLOWED_VOICES[currentVersionCode];
    return allowedVoices && allowedVoices.length > 0;
  };

  const renderContent = () => {
    switch (currentView) {
      case 'summaries':
        return <UserSummaries />;
      
      case 'highlights':
        return <UserHighlights />;
      
      default:
        const currentVersionCode = bibleVersions.find(v => v.id === selectedVersion)?.code || 'finstlk201';
        
        // Get user's voice preference for this version
        const voiceId = getVoiceForVersion(selectedVersion, currentVersionCode);
        
        // If voice is "no-audio", pass undefined as readerKey
        let readerKey: string | undefined;
        if (voiceId && voiceId !== NO_AUDIO_VOICE_ID) {
          const voice = getVoiceById(voiceId);
          if (voice) {
            readerKey = getVoiceReaderKey(voice.voiceId);
          }
        }
        
        return (
          <BibleReader
            book={selectedBook}
            chapter={selectedChapter}
            targetVerse={targetVerse}
            versionCode={currentVersionCode}
            readerKey={readerKey}
            onBookSelect={handleBookSelect}
            onChapterSelect={handleChapterSelect}
            onVerseSelect={onVerseSelect}
            showNextChapterInfo={false}
            isAppTitleNavigation={isAppTitleNavigation}
            onNavigationComplete={onNavigationComplete}
            isFromLatestPosition={isFromLatestPosition}
            onPlaybackStateChange={setIsPlaying}
            onLoadingStateChange={setIsLoadingAudio}
            ref={bibleReaderRef}
            shouldAutoplay={shouldAutoplay}
            onListeningPositionSaved={onListeningPositionSaved}
            onAudioProgressChange={handleAudioProgressChange}
            onChapterDataChange={handleChapterDataChange}
            onAudioCacheStatusChange={handleAudioCacheStatusChange}
          />
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Fixed Header with Bible location and controls */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="space-y-3 p-4">
          {/* Top Row: Bible Location and Version + Bookmark */}
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

            {/* Bookmark Button */}
            {currentView === 'bible' && selectedBook && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={saveAsBookmark}>
                  <Bookmark className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Bottom Row: Audio UI */}
          {currentView === 'bible' && selectedBook && hasAudioEnabled && (
            <div className="bg-muted/30 backdrop-blur-sm border border-border rounded-lg px-4 py-2">
              <div className="flex items-center gap-4">
                {/* Audio Status Icon */}
                {audioFromCache !== null && hasAudioEnabled && (
                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted/50 shrink-0" title={audioFromCache ? 'Audio ladattu välimuistista' : 'Audio generoitu uutena'}>
                    {audioFromCache ? (
                      <Database className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                    )}
                  </div>
                )}
                
                {/* Navigation and Play/Pause Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handlePreviousVerse}
                    disabled={isLoadingAudio || !isPlaying}
                    title="Edellinen jae"
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handlePlaybackToggle} 
                    disabled={isLoadingAudio}
                    className="h-8 w-8 p-0"
                  >
                    {isLoadingAudio ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleNextVerse}
                    disabled={isLoadingAudio || !isPlaying}
                    title="Seuraava jae"
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex-1 space-y-1.5">
                  {/* Estimated Listening Time or Progress Bar */}
                  {chapterVersesCount > 0 && audioDuration === 0 ? (
                    <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground py-1">
                      <Clock className="h-4 w-4" />
                      <span>Arvioitu kuunteluaika: {formatListeningTime(Math.ceil(chapterVersesCount * 4.2))}</span>
                    </div>
                  ) : audioDuration > 0 ? (
                    <>
                      <Progress value={audioProgress} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatListeningTime(Math.floor(audioCurrentTime))}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Jäljellä: {formatListeningTime(Math.floor(audioDuration - audioCurrentTime))}
                        </span>
                        <span>{formatListeningTime(Math.floor(audioDuration))}</span>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* Audio not enabled message */}
          {currentView === 'bible' && selectedBook && !hasAudioEnabled && versionSupportsAudio() && (
            <div className="bg-muted/20 border border-border rounded-lg px-4 py-2 text-center">
              <Button variant="ghost" size="sm" onClick={handleGoToVoiceSettings} className="text-muted-foreground hover:text-foreground">
                <Settings className="h-4 w-4 mr-2" />
                Valitse ääni profiilistasi
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