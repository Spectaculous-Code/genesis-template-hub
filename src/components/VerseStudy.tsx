import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, BookOpen, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getFinnishBookName } from "@/lib/bookNameMapping";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SearchResults from "./SearchResults";
import { searchByStrongsNumber, StrongsSearchResult } from "@/lib/strongsSearchService";
import { SearchResult } from "@/lib/searchService";
import LexiconCard from "./LexiconCard";

interface SelectedVerse {
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
}

interface VerseStudyProps {
  selectedVerse: SelectedVerse;
  onBack: () => void;
  currentVersion?: string; // Add current version prop
}

interface KJVVerseData {
  osis: string;
  plain_text: string;
  tagged_text: string;
}

interface StrongsDefinition {
  number: string;
  definition: string;
  partOfSpeech: string;
  transliteration: string;
}

const VerseStudy = ({ selectedVerse, onBack, currentVersion }: VerseStudyProps) => {
  const [kjvVerse, setKjvVerse] = useState<KJVVerseData | null>(null);
  const [selectedStrongsNumber, setSelectedStrongsNumber] = useState<string | null>(null);
  const [strongsDefinition, setStrongsDefinition] = useState<StrongsDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [strongsSearchResults, setStrongsSearchResults] = useState<StrongsSearchResult | null>(null);
  const [showStrongsSearch, setShowStrongsSearch] = useState(false);
  const [isSearchingStrongs, setIsSearchingStrongs] = useState(false);
  const [strongsHistory, setStrongsHistory] = useState<string[]>([]);
  const [currentStrongsIndex, setCurrentStrongsIndex] = useState<number>(-1);

  useEffect(() => {
    fetchKJVVerse();
  }, [selectedVerse]);

  const fetchKJVVerse = async () => {
    try {
      setLoading(true);
      
      // Use the same book name and numbers that were successfully fetched for the main verse
      const bookName = selectedVerse.bookName;
      const chapterNum = selectedVerse.chapter;
      const verseNum = selectedVerse.verse;
      
      console.log('Fetching KJV verse for:', { bookName, chapterNum, verseNum });
      
      // Try to use the database function first
      const osisRef = `${bookName}.${chapterNum}.${verseNum}`;
      const { data, error } = await supabase
        .rpc('get_kjv_verse_with_strongs', { p_osis: osisRef });

      if (error) {
        console.error('Error fetching KJV verse with function:', error);
        // Fallback to manual query using the same successful pattern
        await fetchKJVVerseManual(bookName, chapterNum, verseNum);
      } else if (data && Array.isArray(data) && data.length > 0) {
        setKjvVerse(data[0] as KJVVerseData);
        console.log('KJV verse fetched successfully with function');
      } else {
        console.log('No data from function, trying manual method');
        // Try manual query as fallback
        await fetchKJVVerseManual(bookName, chapterNum, verseNum);
      }
    } catch (error) {
      console.error('Error in fetchKJVVerse:', error);
      // Always try manual method as final fallback
      await fetchKJVVerseManual(selectedVerse.bookName, selectedVerse.chapter, selectedVerse.verse);
    } finally {
      setLoading(false);
    }
  };

  const fetchKJVVerseManual = async (bookName: string, chapterNum: number, verseNum: number) => {
    try {
      console.log('Fetching KJV verse manually for:', { bookName, chapterNum, verseNum });

      // Get KJV version ID
      const { data: kjvVersion, error: kjvVersionError } = await supabase
        .from('bible_versions')
        .select('id')
        .eq('code', 'KJV')
        .single();

      if (kjvVersionError || !kjvVersion) {
        console.error('KJV version error:', kjvVersionError);
        return;
      }

      console.log('KJV version found:', kjvVersion);

      // Get the book ID for KJV version
      const { data: kjvBookData, error: kjvBookError } = await supabase
        .from('books')
        .select('id')
        .eq('name', bookName) // Use the same book name (like "Matthew")
        .eq('version_id', kjvVersion.id)
        .single();

      if (kjvBookError || !kjvBookData) {
        console.error('KJV book error:', kjvBookError);
        return;
      }

      console.log('KJV book found:', kjvBookData);

      // Get the chapter ID for KJV
      const { data: kjvChapterData, error: kjvChapterError } = await supabase
        .from('chapters')
        .select('id')
        .eq('book_id', kjvBookData.id)
        .eq('chapter_number', chapterNum)
        .single();

      if (kjvChapterError || !kjvChapterData) {
        console.error('KJV chapter error:', kjvChapterError);
        return;
      }

      console.log('KJV chapter found:', kjvChapterData);

      // Get the KJV verse - same pattern as main verse fetching
      const { data: kjvVerseData, error: kjvVerseError } = await supabase
        .from('verses')
        .select('id, text')
        .eq('chapter_id', kjvChapterData.id)
        .eq('version_id', kjvVersion.id)
        .eq('verse_number', verseNum)
        .single();

      if (kjvVerseError || !kjvVerseData) {
        console.error('KJV verse error:', kjvVerseError);
        return;
      }

      console.log('KJV verse found:', kjvVerseData);

      // Get Strong's words for this verse
      const { data: strongsWords, error: strongsError } = await supabase
        .from('kjv_strongs_words')
        .select('word_text, word_order, strongs_number')
        .eq('verse_id', kjvVerseData.id)
        .order('word_order');

      if (strongsError) {
        console.error('Strong\'s words error:', strongsError);
        // Even if Strong's words fail, we can still show the KJV text
      }

      console.log('Strong\'s words found:', strongsWords?.length || 0);

      // Construct tagged text from Strong's words
      const words = strongsWords || [];
      console.log('Strong\'s words for debug:', words);
      console.log('KJV verse text for debug:', kjvVerseData.text);
      
      // Filter out words that contain extraneous content that doesn't belong to the verse
      const filteredWords = words.filter(word => {
        const wordText = word.word_text?.toLowerCase() || '';
        // Filter out obvious extraneous content
        const isExtraneous = wordText.includes('david') || 
                            wordText.includes('psalm') || 
                            wordText.includes('praise') ||
                            (wordText.startsWith('<') && wordText.endsWith('>')); // Filter out standalone Strong's references
        return !isExtraneous;
      });
      
      // Split the original KJV text into words to compare length and detect extra words
      const originalWords = kjvVerseData.text.split(/\s+/).filter(w => w.length > 0);
      
      // Use filtered words but limit to the length of original text to avoid extra words
      let taggedText;
      if (filteredWords.length > 0) {
        // Only use words up to the original verse length to avoid extra content
        const relevantWords = filteredWords.slice(0, originalWords.length);
        taggedText = relevantWords
          .map(word => {
            if (word.strongs_number) {
              return `${word.word_text}<${word.strongs_number}>`;
            }
            return word.word_text;
          })
          .join(' ');
      } else {
        // Fallback: use the original KJV text
        taggedText = kjvVerseData.text;
      }

      console.log('Constructed tagged text for debug:', taggedText);

      const osisRef = `${bookName}.${chapterNum}.${verseNum}`;
      setKjvVerse({
        osis: osisRef,
        plain_text: kjvVerseData.text,
        tagged_text: taggedText
      });

      console.log('KJV verse set successfully');
    } catch (error) {
      console.error('Error in manual KJV fetch:', error);
    }
  };

  const handleStrongsClick = (strongsNumbers: string) => {
    setSelectedStrongsNumber(strongsNumbers);
    // Add to history - if we're not at the end, truncate history after current position
    const newHistory = currentStrongsIndex >= 0 
      ? [...strongsHistory.slice(0, currentStrongsIndex + 1), strongsNumbers]
      : [strongsNumbers];
    setStrongsHistory(newHistory);
    setCurrentStrongsIndex(newHistory.length - 1);
  };

  const handleStrongsLink = (strongsNumber: string) => {
    setSelectedStrongsNumber(strongsNumber);
    // Add to history after current position, removing any future history
    const newHistory = [...strongsHistory.slice(0, currentStrongsIndex + 1), strongsNumber];
    setStrongsHistory(newHistory);
    setCurrentStrongsIndex(newHistory.length - 1);
  };

  const handleStrongsBack = () => {
    if (currentStrongsIndex > 0) {
      const newIndex = currentStrongsIndex - 1;
      setCurrentStrongsIndex(newIndex);
      setSelectedStrongsNumber(strongsHistory[newIndex]);
    }
  };

  const handleStrongsSearch = async () => {
    if (!selectedStrongsNumber) return;
    
    console.log('handleStrongsSearch called with:', selectedStrongsNumber);
    console.log('Current version for search:', currentVersion);
    setIsSearchingStrongs(true);
    try {
      // For multiple Strong's numbers, search for the first one
      const firstNumber = selectedStrongsNumber.split(', ')[0];
      console.log('Searching for first number:', firstNumber);
      const results = await searchByStrongsNumber(firstNumber, currentVersion);
      console.log('Search results received:', results);
      console.log('First result verse text sample:', results?.verses?.[0]?.text?.substring(0, 50));
      console.log('First result version code:', results?.verses?.[0]?.version_code);
      setStrongsSearchResults(results);
      console.log('Setting showStrongsSearch to true');
      setShowStrongsSearch(true);
    } catch (error) {
      console.error('Error searching Strong\'s number:', error);
    } finally {
      setIsSearchingStrongs(false);
    }
  };

  const handleStrongsSearchNavigate = (bookName: string, chapter: number, verse?: number) => {
    setShowStrongsSearch(false);
    // Navigate to the new verse study page
    window.location.href = `/study/${bookName}/${chapter}/${verse || 1}`;
  };

  const renderTaggedText = (taggedText: string) => {
    // First, normalize the text to handle both "word<G123>" and "word <G123>" patterns
    // Handle both Greek (G) and Hebrew (H) Strong's numbers, including multiple numbers
    const normalizedText = taggedText.replace(/\s+<([GH]\d+)>/g, '<$1>');
    
    // Parse the normalized text and create clickable Strong's words
    const words = normalizedText.split(' ');
    
    return words.map((word, index) => {
      // Look for words with one or more Strong's numbers: word<G123><G456>
      const strongsMatch = word.match(/^(.+?)(<[GH].+?>)+$/);
      if (strongsMatch) {
        const [, wordText] = strongsMatch;
        // Extract all Strong's numbers from the word
        const strongsNumbers = word.match(/<([GH]\d+)>/g)?.map(match => match.slice(1, -1)) || [];
        
        return (
          <span key={index}>
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto text-base text-foreground hover:text-primary underline font-normal"
              onClick={() => handleStrongsClick(strongsNumbers.join(', '))}
            >
              {wordText}
            </Button>
            {index < words.length - 1 ? ' ' : ''}
          </span>
        );
      }
      return <span key={index}>{word}{index < words.length - 1 ? ' ' : ''}</span>;
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Takaisin
        </Button>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Jaetutkimus</h1>
        </div>
      </div>

      {/* Original verse */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg">
              {getFinnishBookName(selectedVerse.bookName)} {selectedVerse.chapter}:{selectedVerse.verse}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-relaxed">{selectedVerse.text}</p>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      {/* KJV with Strong's numbers */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg">
              {selectedVerse.bookName}.{selectedVerse.chapter}:{selectedVerse.verse} <span className="text-muted-foreground">(KJV Strongs)</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-muted-foreground">Ladataan KJV-tekstiä...</div>
          ) : kjvVerse ? (
            <div className="text-lg leading-relaxed">
              {renderTaggedText(kjvVerse.tagged_text)}
            </div>
          ) : (
            <div className="text-muted-foreground">
              KJV-tekstiä ei löytynyt tälle jakeelle.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Strong's lexicon card with history */}
      {currentStrongsIndex >= 0 && strongsHistory[currentStrongsIndex] && (
        <div className="mb-6">
          <LexiconCard 
            strongsNumber={strongsHistory[currentStrongsIndex]}
            onSearch={handleStrongsSearch}
            isSearching={isSearchingStrongs}
            onStrongsLink={handleStrongsLink}
            onBack={currentStrongsIndex > 0 ? handleStrongsBack : undefined}
          />
        </div>
      )}

      {/* Strong's Search Results Dialog */}
      <Dialog open={showStrongsSearch} onOpenChange={setShowStrongsSearch}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Jakeet Strong's numerolla {selectedStrongsNumber?.split(', ')[0]} ({currentVersion || 'KJV'})
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {(() => {
              console.log('Rendering dialog content. Dialog open:', showStrongsSearch);
              console.log('strongsSearchResults:', strongsSearchResults);
              console.log('verses count:', strongsSearchResults?.verses?.length);
              console.log('isSearchingStrongs:', isSearchingStrongs);
              return null;
            })()}
            {strongsSearchResults && strongsSearchResults.verses && strongsSearchResults.verses.length > 0 ? (
              <div className="space-y-4 p-1">
                {strongsSearchResults.verses.map((verse) => (
                  <div 
                    key={verse.id} 
                    className="p-4 border rounded cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleStrongsSearchNavigate(verse.book_name, verse.chapter_number, verse.verse_number)}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="text-sm text-muted-foreground mb-2">
                          {currentVersion?.startsWith('fin') ? getFinnishBookName(verse.book_name) : verse.book_name} {verse.chapter_number}:{verse.verse_number}
                        </div>
                        <div className="text-base leading-relaxed">
                          {verse.text}
                        </div>
                      </div>
                      <button 
                        className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStrongsSearchNavigate(verse.book_name, verse.chapter_number, verse.verse_number);
                        }}
                      >
                        Siirry
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : isSearchingStrongs ? (
              <div className="text-center py-8 text-muted-foreground">
                Ladataan hakutuloksia...
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Ei hakutuloksia
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VerseStudy;