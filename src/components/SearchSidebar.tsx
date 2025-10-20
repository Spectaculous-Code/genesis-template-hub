import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
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
}

export function SearchSidebar({ 
  results, 
  extendedResults, 
  versionCode, 
  onVerseClick,
  isLoading 
}: SearchSidebarProps) {
  const { state, isMobile, setOpen } = useSidebar();
  const collapsed = state === "collapsed";

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
        {!collapsed && (
          <span className="text-primary font-bold text-sm tracking-wide">
            HAKU - {allResults.length} kpl
          </span>
        )}
        <SidebarTrigger />
      </div>
      
      {!collapsed && (
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="px-3 space-y-3">
                {isLoading ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Ladataan...
                  </div>
                ) : allResults.length > 0 ? (
                  <>
                    {allResults.map((verse) => (
                      <Card 
                        key={`${verse.verse_id}-${verse.isExtended}`}
                        className="p-3 cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => onVerseClick(verse)}
                      >
                        <div className="flex items-start gap-2">
                          {verse.isExtended ? (
                            <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          ) : (
                            <SearchIcon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          )}
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
                ) : (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Ei hakutuloksia
                  </div>
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      )}
    </Sidebar>
  );
}
