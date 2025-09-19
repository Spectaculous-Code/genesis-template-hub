import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import VerseStudy from "@/components/VerseStudy";
import { supabase } from "@/integrations/supabase/client";
import { getEnglishBookName, englishToFinnishBookNames } from "@/lib/bookNameMapping";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserMenu from "@/components/UserMenu";

interface SelectedVerse {
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
}

const VerseStudyPage = () => {
  const { book, chapter, verse } = useParams<{
    book: string;
    chapter: string;
    verse: string;
  }>();
  const navigate = useNavigate();
  const [selectedVerse, setSelectedVerse] = useState<SelectedVerse | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string>('fin33');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the current version from localStorage if available
    const savedVersionId = localStorage.getItem('selectedBibleVersion');
    if (savedVersionId) {
      // Get the version code from the version ID
      const getVersionCode = async () => {
        const { data: versionData } = await (supabase as any)
          .schema('bible_schema')
          .from('bible_versions')
          .select('code')
          .eq('id', savedVersionId)
          .maybeSingle();
        
        if (versionData?.code) {
          setCurrentVersion(versionData.code);
        }
      };
      getVersionCode();
    }
  }, []);

  useEffect(() => {
    if (book && chapter && verse) {
      fetchVerseData();
    }
  }, [book, chapter, verse, currentVersion]); // Add currentVersion as dependency

  const fetchVerseData = async () => {
    try {
      setLoading(true);
      
      if (!book || !chapter || !verse) {
        console.log('Missing parameters:', { book, chapter, verse });
        return;
      }

      const chapterNum = parseInt(chapter);
      const verseNum = parseInt(verse);
      
      console.log('Fetching verse data for:', { book, chapterNum, verseNum });
      console.log('Using version:', currentVersion);

      // Get the version ID
      const { data: versionData, error: versionError } = await (supabase as any)
        .schema('bible_schema')
        .from('bible_versions')
        .select('id')
        .eq('code', currentVersion)
        .maybeSingle();

      if (versionError || !versionData) {
        console.error('Version error:', versionError);
        return;
      }

      console.log('Version found:', versionData);

      // Get the book ID - use the book name directly as it appears in the database
      const { data: bookData, error: bookError } = await (supabase as any)
        .schema('bible_schema')
        .from('books')
        .select('id')
        .eq('name', book) // Use book name directly (like "Matthew")
        .eq('version_id', versionData.id)
        .maybeSingle();

      if (bookError || !bookData) {
        console.error('Book error:', bookError);
        console.log('Tried to find book:', book);
        return;
      }

      console.log('Book found:', bookData);

      // Get the chapter ID
      const { data: chapterData, error: chapterError } = await (supabase as any)
        .schema('bible_schema')
        .from('chapters')
        .select('id')
        .eq('book_id', bookData.id)
        .eq('chapter_number', chapterNum)
        .maybeSingle();

      if (chapterError || !chapterData) {
        console.error('Chapter error:', chapterError);
        return;
      }

      console.log('Chapter found:', chapterData);

      // Get the specific verse - this is the same way the main Bible reader gets verses
      const { data: verseData, error: verseError } = await (supabase as any)
        .schema('bible_schema')
        .from('verses')
        .select('*')
        .eq('chapter_id', chapterData.id)
        .eq('version_id', versionData.id)
        .eq('verse_number', verseNum)
        .maybeSingle();

      if (verseError || !verseData) {
        console.error('Verse error:', verseError);
        return;
      }

      console.log('Verse found:', verseData);

      // Successfully found the verse
      setSelectedVerse({
        bookName: book,
        chapter: chapterNum,
        verse: verseNum,
        text: verseData.text
      });
      
      console.log('Successfully set verse data');
    } catch (error) {
      console.error('Error fetching verse data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleNavigateToContinueAudio = () => {
    navigate('/');
  };

  const handleNavigateToContinueText = (book?: string, chapter?: number) => {
    if (book && chapter) {
      navigate(`/?book=${book}&chapter=${chapter}`);
    } else {
      navigate('/');
    }
  };

  const handleNavigateToSummaries = () => {
    navigate('/?view=summaries');
  };

  const handleNavigateToHighlights = () => {
    navigate('/?view=highlights');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Ladataan jaetutkimusta...</div>
      </div>
    );
  }

  if (!selectedVerse) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-muted-foreground">Jaetta ei löytynyt</div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={false}>
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
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Vapaa haku..."
                  className="pl-10"
                  readOnly
                  onClick={() => navigate('/')}
                />
              </div>
              
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-xl font-bold text-foreground hover:text-primary transition-colors whitespace-nowrap"
              >
                Raamattu Nyt
              </Button>
              
              <UserMenu />
            </div>
          </header>

          <VerseStudy selectedVerse={selectedVerse} onBack={handleBack} currentVersion={currentVersion} />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default VerseStudyPage;