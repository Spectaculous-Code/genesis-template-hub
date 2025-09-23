import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Book, Search as SearchIcon } from "lucide-react";
import { SearchResult } from "@/lib/searchService";
import { getFinnishBookName } from "@/lib/bookNameMapping";

interface SearchResultsProps {
  results: SearchResult | null;
  onClose: () => void;
  onNavigateToVerse: (bookName: string, chapter: number, verse?: number, text?: string) => void;
  isLoading: boolean;
  versionCode?: string; // Add version code prop
}

const SearchResults = ({ results, onClose, onNavigateToVerse, isLoading, versionCode }: SearchResultsProps) => {
  if (!results && !isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-start justify-center pt-20">
      <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            {results?.type === 'reference' ? (
              <Book className="h-5 w-5 text-primary" />
            ) : (
              <SearchIcon className="h-5 w-5 text-primary" />
            )}
            <h2 className="text-lg font-semibold">
              {isLoading ? 'Etsitään...' : 
               results?.type === 'reference' 
                 ? `Raamatunviittaus${versionCode ? ` (${versionCode})` : ''}${results?.verses ? ` - ${results.verses.length} tulosta` : ''}` 
                 : `Tekstihaku${versionCode ? ` (${versionCode})` : ''}${results?.verses ? ` - ${results.verses.length} tulosta` : ''}`}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-4rem)]">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Ladataan hakutuloksia...
            </div>
          ) : results?.verses && results.verses.length > 0 ? (
            <div className="space-y-4">
              {results.verses.map((verse) => (
                <Card 
                  key={verse.verse_id} 
                  className="p-4 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => onNavigateToVerse(verse.book_name, verse.chapter_number, verse.verse_number, verse.text_content)}
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
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToVerse(verse.book_name, verse.chapter_number, verse.verse_number, verse.text_content);
                      }}
                    >
                      Siirry
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {results?.type === 'reference' 
                ? 'Raamatunviitettä ei löytynyt'
                : 'Ei hakutuloksia'
              }
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SearchResults;