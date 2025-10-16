import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Book, ArrowLeft } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { performSearch, SearchResult } from "@/lib/searchService";
import { getFinnishBookName, getBookOrder } from "@/lib/bookNameMapping";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [versionCode, setVersionCode] = useState(searchParams.get("v") || "finstlk201");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<any>(null);

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
    try {
      const result = await performSearch(searchQuery, version);
      setResults(result);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
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

      {/* Content */}
      <ResizablePanelGroup direction="horizontal" className="min-h-[calc(100vh-140px)]">
        {/* Left Panel - Search Results */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full overflow-y-auto p-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Ladataan hakutuloksia...
              </div>
            ) : sortedVerses.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  {results?.type === 'reference' ? (
                    <Book className="h-5 w-5 text-primary" />
                  ) : (
                    <SearchIcon className="h-5 w-5 text-primary" />
                  )}
                  <h2 className="text-lg font-semibold">
                    {results?.type === 'reference' 
                      ? `Raamatunviittaus (${versionCode})` 
                      : `Tekstihaku (${versionCode})`}
                    {' - '}{sortedVerses.length} tulosta
                  </h2>
                </div>

                {sortedVerses.map((verse) => (
                  <Card 
                    key={verse.verse_id} 
                    className={`p-4 cursor-pointer hover:bg-accent transition-colors ${
                      selectedVerse?.verse_id === verse.verse_id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedVerse(verse)}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="text-sm text-muted-foreground mb-2">
                          {versionCode?.startsWith('fin') ? getFinnishBookName(verse.book_name) : verse.book_name} {verse.chapter_number}:{verse.verse_number}
                        </div>
                        <div className="text-base leading-relaxed">
                          {verse.text_content}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : query ? (
              <div className="text-center py-8 text-muted-foreground">
                {results?.type === 'reference' 
                  ? 'Raamatunviitettä ei löytynyt'
                  : 'Ei hakutuloksia'
                }
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Syötä hakusana aloittaaksesi haun
              </div>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel - Details */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full overflow-y-auto p-4 bg-muted/30">
            {selectedVerse ? (
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">
                  {versionCode?.startsWith('fin') ? getFinnishBookName(selectedVerse.book_name) : selectedVerse.book_name} {selectedVerse.chapter_number}:{selectedVerse.verse_number}
                </h3>
                <p className="text-lg leading-relaxed mb-6">
                  {selectedVerse.text_content}
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => navigate(`/study/${selectedVerse.book_name}/${selectedVerse.chapter_number}/${selectedVerse.verse_number}`)}
                  >
                    Avaa tutkimussivulla
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Valitse jae vasemmalta nähdäksesi lisätietoja
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default SearchPage;
