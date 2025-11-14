import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, ArrowLeft } from "lucide-react";
import { performSearch, SearchResult, searchTextExtended } from "@/lib/searchService";
import { getBookOrder } from "@/lib/bookNameMapping";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SearchSidebar } from "@/components/SearchSidebar";
import BibleReader from "@/components/BibleReader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [versionCode, setVersionCode] = useState(searchParams.get("v") || "finstlk201");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [extendedResults, setExtendedResults] = useState<SearchResult | null>(null);
  const [isLoadingExtended, setIsLoadingExtended] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedVerseNum, setSelectedVerseNum] = useState<number | null>(null);

  const saveSearchToHistory = async (searchQuery: string, searchType: 'reference' | 'text', version: string) => {
    if (!user) {
      console.log("No user, skipping search history save");
      return;
    }
    
    console.log("Saving search to history:", { searchQuery, searchType, version, userId: user.id });
    
    try {
      const { data, error } = await supabase.from('search_history').insert({
        user_id: user.id,
        search_query: searchQuery,
        search_type: searchType,
        version_code: version
      }).select();
      
      if (error) {
        console.error("Error saving search history:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
      } else {
        console.log("Search history saved successfully", data);
      }
    } catch (error) {
      console.error("Exception saving search history:", error);
    }
  };

  useEffect(() => {
    const q = searchParams.get("q");
    const v = searchParams.get("v");
    if (q) {
      setQuery(q);
      if (v) setVersionCode(v);
      handleSearch(q, v || "finstlk201");
    }
  }, [searchParams]);

  const handleSearch = async (searchQuery: string, version: string) => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setExtendedResults(null);
    setSidebarOpen(false);
    try {
      const result = await performSearch(searchQuery, version);
      setResults(result);
      
      // Save search to history
      await saveSearchToHistory(searchQuery, result.type, version);
      
      // Open sidebar if we have results
      if (result.verses && result.verses.length > 0) {
        setSidebarOpen(true);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtendedSearch = async (searchQuery?: string, version?: string) => {
    const q = searchQuery || query;
    const v = version || versionCode;
    if (!q.trim()) return;
    
    setIsLoadingExtended(true);
    try {
      const result = await searchTextExtended(q, v);
      setExtendedResults(result);
    } catch (error) {
      console.error("Extended search error:", error);
    } finally {
      setIsLoadingExtended(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}&v=${versionCode}`);
    }
  };

  const sortedVerses = results?.verses ? [...results.verses].sort((a, b) => {
    const orderA = getBookOrder(a.book_name);
    const orderB = getBookOrder(b.book_name);
    
    if (orderA !== orderB) return orderA - orderB;
    if (a.chapter_number !== b.chapter_number) return a.chapter_number - b.chapter_number;
    return a.verse_number - b.verse_number;
  }) : [];

  // Filter extended results to show only new verses not in the original results
  const newExtendedVerses = extendedResults?.verses 
    ? extendedResults.verses.filter(extVerse => 
        !sortedVerses.some(origVerse => origVerse.verse_id === extVerse.verse_id)
      ).sort((a, b) => {
        const orderA = getBookOrder(a.book_name);
        const orderB = getBookOrder(b.book_name);
        if (orderA !== orderB) return orderA - orderB;
        if (a.chapter_number !== b.chapter_number) return a.chapter_number - b.chapter_number;
        return a.verse_number - b.verse_number;
      })
    : [];

  const handleVerseClick = (verse: any) => {
    // Close sidebar but keep it available on the right
    setSidebarOpen(false);
    // Show Bible reader with selected verse
    setSelectedBook(verse.book_name);
    setSelectedChapter(verse.chapter_number);
    setSelectedVerseNum(verse.verse_number);
  };

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="min-h-screen bg-background w-full flex relative">
        <SidebarInset className="flex-1 min-w-0">
          <header className="border-b bg-card sticky top-0 z-10">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center gap-4 mb-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold">Hakutulokset</h1>
              </div>
              
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Hae Raamatusta..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit">
                  <SearchIcon className="h-4 w-4 mr-2" />
                  Hae
                </Button>
              </form>
            </div>
          </header>

          <main className="flex-1 overflow-hidden">
            {selectedBook && selectedChapter ? (
              <BibleReader
                book={selectedBook}
                chapter={selectedChapter}
                targetVerse={selectedVerseNum || undefined}
                versionCode={versionCode}
                onBookSelect={setSelectedBook}
                onChapterSelect={setSelectedChapter}
                onVerseSelect={(bookName, chapter, verse, text) => {
                  // Handle verse selection if needed
                }}
                showNextChapterInfo={true}
              />
            ) : !query ? (
              <div className="text-center py-16 text-muted-foreground">
                <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Syötä hakusana aloittaaksesi haun</p>
              </div>
            ) : isLoading ? (
              <div className="text-center py-16 text-muted-foreground">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p>Ladataan hakutuloksia...</p>
              </div>
            ) : sortedVerses.length === 0 && newExtendedVerses.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg">
                  {results?.type === 'reference' 
                    ? 'Raamatunviitettä ei löytynyt'
                    : 'Ei hakutuloksia'
                  }
                </p>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto p-6">
                <p className="text-muted-foreground mb-6">
                  Löytyi {sortedVerses.length + newExtendedVerses.length} tulosta. 
                  Klikkaa sivupalkin kuvaketta nähdäksesi tulokset.
                </p>
              </div>
            )}
          </main>
        </SidebarInset>

        <div className="fixed right-0 top-0 bottom-0 z-50 pointer-events-none">
          <div className="pointer-events-auto h-full">
            <SearchSidebar 
              results={sortedVerses}
              extendedResults={newExtendedVerses}
              versionCode={versionCode}
              onVerseClick={handleVerseClick}
              isLoading={isLoading || isLoadingExtended}
              onExtendedSearch={() => handleExtendedSearch()}
              canExtendSearch={results?.type === 'text' && sortedVerses.length > 0}
              onSearchClick={(query, version) => {
                setQuery(query);
                setVersionCode(version);
                handleSearch(query, version);
              }}
            />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default SearchPage;
