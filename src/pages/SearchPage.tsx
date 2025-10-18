import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, ArrowLeft, Sparkles } from "lucide-react";
import { performSearch, SearchResult, searchTextExtended } from "@/lib/searchService";
import { getBookOrder } from "@/lib/bookNameMapping";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SearchSidebar } from "@/components/SearchSidebar";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [versionCode, setVersionCode] = useState(searchParams.get("v") || "finstlk201");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [extendedResults, setExtendedResults] = useState<SearchResult | null>(null);
  const [isLoadingExtended, setIsLoadingExtended] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      // Open sidebar if we have results
      if (result.verses && result.verses.length > 0) {
        setSidebarOpen(true);
      }
      // Auto-trigger extended search for text searches
      if (result.type === 'text') {
        handleExtendedSearch(searchQuery, version);
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
    setSidebarOpen(false);
    navigate(`/study/${verse.book_name}/${verse.chapter_number}/${verse.verse_number}`);
  };

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="min-h-screen bg-background w-full flex">
        <SidebarInset className="flex-1">
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
                {results?.type === 'text' && sortedVerses.length > 0 && (
                  <Button 
                    onClick={() => handleExtendedSearch()}
                    variant="outline"
                    disabled={isLoadingExtended}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isLoadingExtended ? 'Haetaan...' : 'Laajennettu'}
                  </Button>
                )}
              </form>
            </div>
          </header>

          <main className="p-6">
            {!query ? (
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
              <div className="max-w-4xl mx-auto">
                <p className="text-muted-foreground mb-6">
                  Löytyi {sortedVerses.length + newExtendedVerses.length} tulosta. 
                  Klikkaa sivupalkin kuvaketta nähdäksesi tulokset.
                </p>
              </div>
            )}
          </main>
        </SidebarInset>

        <SearchSidebar 
          results={sortedVerses}
          extendedResults={newExtendedVerses}
          versionCode={versionCode}
          onVerseClick={handleVerseClick}
          isLoading={isLoading || isLoadingExtended}
        />
      </div>
    </SidebarProvider>
  );
};

export default SearchPage;
