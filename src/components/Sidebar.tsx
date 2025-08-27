import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";
import { bibleBooks } from "@/data/mockBibleData";

interface SidebarProps {
  isOpen: boolean;
  selectedBook: string;
  selectedChapter: number;
  onBookSelect: (book: string) => void;
  onChapterSelect: (chapter: number) => void;
  onClose: () => void;
}

const Sidebar = ({ 
  isOpen, 
  selectedBook, 
  selectedChapter, 
  onBookSelect, 
  onChapterSelect, 
  onClose 
}: SidebarProps) => {
  const currentBook = bibleBooks.find(book => book.name === selectedBook);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed md:static top-0 left-0 h-screen w-80 bg-card border-r border-border z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex items-center justify-between p-4 md:hidden">
          <h2 className="font-semibold">Raamatun kirjat</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <ScrollArea className="h-[calc(100vh-80px)] md:h-[calc(100vh-72px)]">
          <div className="p-4 space-y-4">
            {/* New Testament */}
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2 px-2">
                UUSI TESTAMENTTI
              </h3>
              <div className="space-y-1">
                {bibleBooks
                  .filter(book => book.testament === "new")
                  .map((book) => (
                    <Button
                      key={book.name}
                      variant={selectedBook === book.name ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        onBookSelect(book.name);
                        onChapterSelect(1);
                      }}
                    >
                      {book.name}
                    </Button>
                  ))}
              </div>
            </div>

            <Separator />

            {/* Old Testament */}
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2 px-2">
                VANHA TESTAMENTTI
              </h3>
              <div className="space-y-1">
                {bibleBooks
                  .filter(book => book.testament === "old")
                  .map((book) => (
                    <Button
                      key={book.name}
                      variant={selectedBook === book.name ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        onBookSelect(book.name);
                        onChapterSelect(1);
                      }}
                    >
                      {book.name}
                    </Button>
                  ))}
              </div>
            </div>

            {/* Chapter selection for current book */}
            {currentBook && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2 px-2">
                    {selectedBook.toUpperCase()} - LUVUT
                  </h3>
                  <div className="grid grid-cols-6 gap-1">
                    {Array.from({ length: currentBook.chapters }, (_, i) => i + 1).map((chapter) => (
                      <Button
                        key={chapter}
                        variant={selectedChapter === chapter ? "default" : "outline"}
                        size="sm"
                        className="h-8"
                        onClick={() => onChapterSelect(chapter)}
                      >
                        {chapter}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </aside>
    </>
  );
};

export default Sidebar;