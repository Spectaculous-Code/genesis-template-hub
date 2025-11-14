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
import { SearchIcon, Sparkles, Clock, BookText, Plus } from "lucide-react";
import { getFinnishBookName } from "@/lib/bookNameMapping";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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
  onSearchClick?: (query: string, versionCode: string) => void;
}

export function SearchSidebar({ 
  results, 
  extendedResults, 
  versionCode, 
  onVerseClick,
  isLoading,
  onExtendedSearch,
  canExtendSearch,
  onSearchClick
}: SearchSidebarProps) {
  const { state, isMobile, setOpen } = useSidebar();
  const collapsed = state === "collapsed";
  const extendedResultsRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { recentSearches, loading: loadingRecent } = useRecentSearches();
  const { user } = useAuth();
  const { toast } = useToast();

  const addToSummary = async (verse: SearchResult) => {
    if (!user) {
      toast({
        title: "Kirjaudu sisään",
        description: "Sinun täytyy kirjautua sisään lisätäksesi jakeita koosteeseen",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get or create the latest summary
      let { data: latestSummary } = await supabase
        .from('summaries')
        .select('id, title')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Create a new summary if none exists
      if (!latestSummary) {
        const { data: newSummary, error: summaryError } = await supabase
          .from('summaries')
          .insert({
            user_id: user.id,
            title: `Uusi kooste ${new Date().toLocaleDateString('fi-FI')}`
          })
          .select('id, title')
          .single();

        if (summaryError) throw summaryError;
        latestSummary = newSummary;
      }

      // Get or create the first group in the summary
      let { data: firstGroup } = await supabase
        .from('summary_groups')
        .select('id')
        .eq('summary_id', latestSummary.id)
        .order('group_order', { ascending: true })
        .limit(1)
        .maybeSingle();

      // Create first group if none exists
      if (!firstGroup) {
        const { data: newGroup, error: groupError } = await supabase
          .from('summary_groups')
          .insert({
            summary_id: latestSummary.id,
            subtitle: 'Raamatunviittaukset',
            group_order: 0
          })
          .select('id')
          .single();

        if (groupError) throw groupError;
        firstGroup = newGroup;
      }

      // Get the next reference order for this group
      const { data: existingRefs } = await supabase
        .from('summary_bible_references')
        .select('reference_order')
        .eq('group_id', firstGroup.id)
        .order('reference_order', { ascending: false })
        .limit(1);

      const nextOrder = existingRefs && existingRefs.length > 0 ? existingRefs[0].reference_order + 1 : 0;

      // Format the verse reference (e.g., "Ilm.1:7")
      const finnishBookName = getFinnishBookName(verse.book_name);
      const referenceText = `${finnishBookName}.${verse.chapter_number}:${verse.verse_number}`;

      // Add the bible reference
      const { error: refError } = await supabase
        .from('summary_bible_references')
        .insert({
          group_id: firstGroup.id,
          reference_text: referenceText,
          reference_order: nextOrder
        });

      if (refError) throw refError;

      toast({
        title: "Lisätty koosteeseen",
        description: `Jae ${referenceText} lisätty koosteeseen "${latestSummary.title}"`
      });

    } catch (error) {
      console.error("Error adding to summary:", error);
      toast({
        title: "Virhe",
        description: "Jakeen lisääminen koosteeseen epäonnistui",
        variant: "destructive"
      });
    }
  };

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

  const hasResults = allResults.length > 0;
  const showRecentSearches = !hasResults && !isLoading;

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
      className={collapsed ? "w-12" : "w-80"}
    >
      <div className="p-2 border-b border-border flex items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          {collapsed ? (
            <SearchIcon className="h-4 w-4 text-primary" />
          ) : (
            <span className="text-primary font-bold text-sm tracking-wide">
              {hasResults ? `HAKU - ${allResults.length} kpl` : 'VIIMEISIMMÄT HAUT'}
            </span>
          )}
        </div>
        {!collapsed && <SidebarTrigger />}
      </div>
      
      <SidebarContent ref={scrollContainerRef} className={collapsed ? "opacity-0 invisible h-0" : "opacity-100 visible transition-opacity duration-200"}>
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="px-3 space-y-3">
                {showRecentSearches ? (
                  <div className="space-y-3">
                    {loadingRecent ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">Ladataan...</p>
                      </div>
                    ) : recentSearches.length === 0 ? (
                      <div className="text-center py-8">
                        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-30" />
                        <p className="text-sm text-muted-foreground">Ei hakuhistoriaa</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Tekemäsi haut tallentuvat tänne
                        </p>
                      </div>
                    ) : (
                      <>
                        {recentSearches.map((search) => (
                          <Card
                            key={search.id}
                            className="p-3 hover:bg-accent transition-colors cursor-pointer group"
                            onClick={() => onSearchClick?.(search.search_query, search.version_code)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">
                                {search.search_type === 'reference' ? (
                                  <BookText className="h-4 w-4 text-primary" />
                                ) : (
                                  <SearchIcon className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                                  {search.search_query}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {search.search_type === 'reference' ? 'Raamatunviite' : 'Tekstihaku'} • {search.version_code}
                                </p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </>
                    )}
                  </div>
                ) : isLoading ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Ladataan...
                  </div>
                ) : allResults.length > 0 ? (
                  <>
                    {results.map((verse) => (
                      <Card 
                        key={verse.verse_id}
                        className="p-3 cursor-pointer hover:bg-accent transition-colors group"
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
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToSummary(verse);
                            }}
                            title="Lisää koosteeseen"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
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
                            className="p-3 cursor-pointer hover:bg-accent transition-colors group"
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
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToSummary(verse);
                                }}
                                title="Lisää koosteeseen"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
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
