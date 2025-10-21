import { useRef, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchIcon, Sparkles } from "lucide-react";
import { getFinnishBookName } from "@/lib/bookNameMapping";

interface SearchResult {
  verse_id: string;
  text_content: string;
  verse_number: number;
  chapter_number: number;
  book_name: string;
  osis: string;
}

interface SearchSidebarProps {
  results: SearchResult[];
  extendedResults: SearchResult[];
  versionCode: string;
  onVerseClick: (verse: SearchResult) => void;
  isLoading: boolean;
  onExtendedSearch: () => void;
  canExtendSearch: boolean;
}

export function SearchSidebar({ 
  results, 
  extendedResults, 
  versionCode, 
  onVerseClick,
  isLoading,
  onExtendedSearch,
  canExtendSearch
}: SearchSidebarProps) {
  const { state, isMobile, setOpen } = useSidebar();
  const collapsed = state === "collapsed";
  const extendedResultsRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Save scroll position when scrolling
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      scrollPositionRef.current = container.scrollTop;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Restore scroll position when sidebar opens
  useEffect(() => {
    if (!collapsed && scrollContainerRef.current) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollPositionRef.current;
        }
      });
    }
  }, [collapsed]);

  // Scroll to extended results when they appear
  useEffect(() => {
    if (extendedResults.length > 0 && extendedResultsRef.current) {
      extendedResultsRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, [extendedResults.length]);

  // Combine results, marking which are from extended search
  const allResults = [
    ...results.map(r => ({ ...r, isExtended: false })),
    ...extendedResults.map(r => ({ ...r, isExtended: true }))
  ];

  // Hover handlers for auto-expand
  const handleMouseEnter = () => {
    if (!isMobile && collapsed) {
      setOpen(true);
    }
  };
  
  const handleMouseLeave = () => {
    if (!isMobile && !collapsed) {
      setOpen(false);
    }
  };

  return (
    <Sidebar 
      side="right"
      variant="floating"
      collapsible="icon"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="p-2 border-b border-border flex items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          {collapsed ? (
            <SearchIcon className="h-4 w-4 text-primary" />
          ) : (
            <span className="text-primary font-bold text-sm tracking-wide">
              HAKU - {allResults.length} kpl
            </span>
          )}
        </div>
        {!collapsed && <SidebarTrigger />}
      </div>
      
      <SidebarContent ref={scrollContainerRef} className={collapsed ? "opacity-0 invisible h-0" : "opacity-100 visible transition-opacity duration-200"}>
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="px-3 space-y-3">
                {isLoading ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Ladataan...
                  </div>
                ) : allResults.length > 0 ? (
                  <>
                    {results.map((verse) => (
                      <Card 
                        key={verse.verse_id}
                        className="p-3 cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => onVerseClick(verse)}
                      >
                        <div className="flex items-start gap-2">
                          <SearchIcon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-muted-foreground mb-1.5 font-medium">
                              {versionCode?.startsWith('fin') 
                                ? getFinnishBookName(verse.book_name) 
                                : verse.book_name} {verse.chapter_number}:{verse.verse_number}
                            </div>
                            <div className="text-sm leading-relaxed">
                              {verse.text_content}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                    
                    {extendedResults.length > 0 && (
                      <>
                        <div 
                          ref={extendedResultsRef}
                          className="py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-t border-border mt-2 pt-4"
                        >
                          Yhdyssanatulokset
                        </div>
                        {extendedResults.map((verse) => (
                          <Card 
                            key={verse.verse_id}
                            className="p-3 cursor-pointer hover:bg-accent transition-colors"
                            onClick={() => onVerseClick(verse)}
                          >
                            <div className="flex items-start gap-2">
                              <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-muted-foreground mb-1.5 font-medium">
                                  {versionCode?.startsWith('fin') 
                                    ? getFinnishBookName(verse.book_name) 
                                    : verse.book_name} {verse.chapter_number}:{verse.verse_number}
                                </div>
                                <div className="text-sm leading-relaxed">
                                  {verse.text_content}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </>
                    )}
                    
                    {canExtendSearch && extendedResults.length === 0 && (
                      <Button
                        onClick={onExtendedSearch}
                        variant="outline"
                        className="w-full"
                        disabled={isLoading}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Hae yhdyssanoja
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Ei hakutuloksia
                  </div>
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
    </Sidebar>
  );
}
