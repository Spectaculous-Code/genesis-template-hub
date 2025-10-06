import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Plus, FileText, Calendar, User, BookOpen, Search, ArrowLeft, Edit2, Check, X, Trash2, Eye, EyeOff, MoveRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { fi } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Summary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  groups: SummaryGroup[];
}

interface SummaryGroup {
  id: string;
  subtitle: string;
  text_content: string | null;
  group_order: number;
  bible_references: BibleReference[];
}

interface BibleReference {
  id: string;
  reference_text: string;
  reference_order: number;
  version_id: string | null;
}

const SummaryContent = () => {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [latestSummary, setLatestSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { setOpen } = useSidebar();
  
  // Edit states
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [editingSubtitle, setEditingSubtitle] = useState<string | null>(null);
  const [editSubtitleValue, setEditSubtitleValue] = useState("");
  const [editingTextContent, setEditingTextContent] = useState<string | null>(null);
  const [editTextContentValue, setEditTextContentValue] = useState("");
  const [addingNewSubtitle, setAddingNewSubtitle] = useState(false);
  const [newSubtitleValue, setNewSubtitleValue] = useState("");
  
  // Bible verse expansion states
  const [expandedVerses, setExpandedVerses] = useState<Set<string>>(new Set());
  const [verseTexts, setVerseTexts] = useState<Map<string, string>>(new Map());
  const [loadingVerses, setLoadingVerses] = useState<Set<string>>(new Set());
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSearch = (query: string) => {
    if (query.trim()) {
      // Navigate to home with search query
      navigate(`/?search=${encodeURIComponent(query)}`);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchSummaries();
  }, [user, navigate]);

  const fetchSummaries = async () => {
    if (!user) return;

    try {
      const { data: summariesData, error } = await supabase
        .from('summaries')
        .select(`
          id,
          title,
          created_at,
          updated_at,
          summary_groups (
            id,
            subtitle,
            text_content,
            group_order,
            summary_bible_references (
              id,
              reference_text,
              reference_order,
              version_id
            )
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching summaries:', error);
        toast({
          title: "Virhe",
          description: "Koosteiden lataaminen epäonnistui",
          variant: "destructive"
        });
        return;
      }

      const processedSummaries: Summary[] = summariesData?.map(summary => ({
        ...summary,
        groups: summary.summary_groups
          .map(group => ({
            ...group,
            bible_references: group.summary_bible_references.sort((a, b) => a.reference_order - b.reference_order)
          }))
          .sort((a, b) => a.group_order - b.group_order)
      })) || [];

      setSummaries(processedSummaries);
      setLatestSummary(processedSummaries[0] || null);
    } catch (error) {
      console.error('Error fetching summaries:', error);
      toast({
        title: "Virhe",
        description: "Koosteiden lataaminen epäonnistui",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewSummary = async () => {
    if (!user) return;

    const newTitle = `Uusi kooste ${format(new Date(), 'dd.MM.yyyy')}`;
    
    try {
      const { data, error } = await supabase
        .from('summaries')
        .insert({
          user_id: user.id,
          title: newTitle
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating summary:', error);
        toast({
          title: "Virhe",
          description: "Koosteen luominen epäonnistui",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Kooste luotu",
        description: newTitle
      });

      fetchSummaries();
    } catch (error) {
      console.error('Error creating summary:', error);
      toast({
        title: "Virhe",
        description: "Koosteen luominen epäonnistui",
        variant: "destructive"
      });
    }
  };

  // Edit functionality
  const startEditingTitle = () => {
    if (latestSummary) {
      setEditTitleValue(latestSummary.title);
      setEditingTitle(true);
    }
  };

  const saveTitle = async () => {
    if (!latestSummary || !editTitleValue.trim()) return;

    try {
      const { error } = await supabase
        .from('summaries')
        .update({ title: editTitleValue.trim() })
        .eq('id', latestSummary.id);

      if (error) throw error;

      toast({
        title: "Tallennettu",
        description: "Koosteen nimi päivitetty"
      });

      setEditingTitle(false);
      fetchSummaries();
    } catch (error) {
      console.error('Error updating title:', error);
      toast({
        title: "Virhe",
        description: "Nimen päivittäminen epäonnistui",
        variant: "destructive"
      });
    }
  };

  const cancelTitleEdit = () => {
    setEditingTitle(false);
    setEditTitleValue("");
  };

  const startEditingSubtitle = (groupId: string, currentSubtitle: string) => {
    setEditingSubtitle(groupId);
    setEditSubtitleValue(currentSubtitle);
  };

  const saveSubtitle = async () => {
    if (!editingSubtitle || !editSubtitleValue.trim()) return;

    try {
      const { error } = await supabase
        .from('summary_groups')
        .update({ subtitle: editSubtitleValue.trim() })
        .eq('id', editingSubtitle);

      if (error) throw error;

      toast({
        title: "Tallennettu",
        description: "Alaotsikko päivitetty"
      });

      setEditingSubtitle(null);
      setEditSubtitleValue("");
      fetchSummaries();
    } catch (error) {
      console.error('Error updating subtitle:', error);
      toast({
        title: "Virhe",
        description: "Alaotsikon päivittäminen epäonnistui",
        variant: "destructive"
      });
    }
  };

  const cancelSubtitleEdit = () => {
    setEditingSubtitle(null);
    setEditSubtitleValue("");
  };

  const startEditingTextContent = (groupId: string, currentText: string | null) => {
    setEditingTextContent(groupId);
    setEditTextContentValue(currentText || "");
  };

  const saveTextContent = async () => {
    if (!editingTextContent) return;

    try {
      const { error } = await supabase
        .from('summary_groups')
        .update({ text_content: editTextContentValue.trim() || null })
        .eq('id', editingTextContent);

      if (error) throw error;

      toast({
        title: "Tallennettu",
        description: "Tekstisisältö päivitetty"
      });

      setEditingTextContent(null);
      setEditTextContentValue("");
      fetchSummaries();
    } catch (error) {
      console.error('Error updating text content:', error);
      toast({
        title: "Virhe",
        description: "Tekstisisällön päivittäminen epäonnistui",
        variant: "destructive"
      });
    }
  };

  const cancelTextContentEdit = () => {
    setEditingTextContent(null);
    setEditTextContentValue("");
  };

  const startAddingNewSubtitle = () => {
    setAddingNewSubtitle(true);
    setNewSubtitleValue("");
  };

  const saveNewSubtitle = async () => {
    if (!latestSummary || !newSubtitleValue.trim()) return;

    try {
      // Get the highest group_order for this summary
      const { data: existingGroups } = await supabase
        .from('summary_groups')
        .select('group_order')
        .eq('summary_id', latestSummary.id)
        .order('group_order', { ascending: false })
        .limit(1);

      const nextOrder = existingGroups && existingGroups.length > 0 
        ? existingGroups[0].group_order + 1 
        : 0;

      const { error } = await supabase
        .from('summary_groups')
        .insert({
          summary_id: latestSummary.id,
          subtitle: newSubtitleValue.trim(),
          group_order: nextOrder
        });

      if (error) throw error;

      toast({
        title: "Lisätty",
        description: "Uusi alaotsikko luotu"
      });

      setAddingNewSubtitle(false);
      setNewSubtitleValue("");
      fetchSummaries();
    } catch (error) {
      console.error('Error adding new subtitle:', error);
      toast({
        title: "Virhe",
        description: "Alaotsikon lisääminen epäonnistui",
        variant: "destructive"
      });
    }
  };

  const cancelNewSubtitle = () => {
    setAddingNewSubtitle(false);
    setNewSubtitleValue("");
  };

  const moveBibleReference = async (referenceId: string, newGroupId: string, referenceText: string) => {
    try {
      const { error } = await supabase
        .from('summary_bible_references')
        .update({ group_id: newGroupId })
        .eq('id', referenceId);

      if (error) throw error;

      toast({
        title: "Siirretty",
        description: `Viittaus "${referenceText}" siirretty toiseen ryhmään`
      });

      fetchSummaries();
    } catch (error) {
      console.error('Error moving bible reference:', error);
      toast({
        title: "Virhe",
        description: "Viittauksen siirtäminen epäonnistui",
        variant: "destructive"
      });
    }
  };

  const deleteBibleReference = async (referenceId: string) => {
    try {
      const { error } = await supabase
        .from('summary_bible_references')
        .delete()
        .eq('id', referenceId);

      if (error) throw error;

      toast({
        title: "Poistettu",
        description: "Raamatunviittaus poistettu"
      });

      fetchSummaries();
    } catch (error) {
      console.error('Error deleting bible reference:', error);
      toast({
        title: "Virhe",
        description: "Viittauksen poistaminen epäonnistui",
        variant: "destructive"
      });
    }
  };

  const toggleVerseExpansion = async (referenceId: string, referenceText: string) => {
    const isExpanded = expandedVerses.has(referenceId);
    
    if (isExpanded) {
      // Collapse verse
      const newExpanded = new Set(expandedVerses);
      newExpanded.delete(referenceId);
      setExpandedVerses(newExpanded);
    } else {
      // Expand verse - first check if we already have the text
      if (!verseTexts.has(referenceId)) {
        await fetchVerseText(referenceId, referenceText);
      }
      
      const newExpanded = new Set(expandedVerses);
      newExpanded.add(referenceId);
      setExpandedVerses(newExpanded);
    }
  };

  const fetchVerseText = async (referenceId: string, referenceText: string) => {
    if (loadingVerses.has(referenceId)) return;
    
    const newLoading = new Set(loadingVerses);
    newLoading.add(referenceId);
    setLoadingVerses(newLoading);

    try {
      // Parse the reference (e.g., "Matthew.1:2", "Matt.1:2", "1. Moos. 1:1")
      const parseReference = (ref: string) => {
        // Remove extra spaces and normalize
        const normalized = ref.trim();
        
        // Try different patterns
        // Pattern 1: "Matthew.1:2" or "Matt.1:2"
        let match = normalized.match(/^([^.]+)\.(\d+):(\d+)$/);
        if (match) {
          return {
            book: match[1].trim(),
            chapter: parseInt(match[2]),
            verse: parseInt(match[3])
          };
        }
        
        // Pattern 2: "Matthew 1:2" or "Matt 1:2"
        match = normalized.match(/^([^0-9]+)\s+(\d+):(\d+)$/);
        if (match) {
          return {
            book: match[1].trim(),
            chapter: parseInt(match[2]),
            verse: parseInt(match[3])
          };
        }
        
        // Pattern 3: "1. Moos. 1:1" (Finnish style)
        match = normalized.match(/^(\d+\.\s*\w+\.?)\s+(\d+):(\d+)$/);
        if (match) {
          return {
            book: match[1].trim(),
            chapter: parseInt(match[2]),
            verse: parseInt(match[3])
          };
        }
        
        return null;
      };

      const parsed = parseReference(referenceText);
      if (!parsed) {
        const newTexts = new Map(verseTexts);
        newTexts.set(referenceId, `Viittauksen "${referenceText}" muoto ei ole tuettu.`);
        setVerseTexts(newTexts);
        return;
      }

      console.log('Searching for verse:', parsed);

      // Use the dedicated get_verse_by_ref function
      const { data: verses, error } = await supabase.rpc('get_verse_by_ref' as any, {
        p_ref_book: parsed.book,
        p_chapter: parsed.chapter,
        p_verse: parsed.verse,
        p_version_code: null, // Use default version (finstlk201)
        p_language_code: 'fi'
      });

      if (error) {
        console.error('Error fetching verse:', error);
        throw error;
      }

      const newTexts = new Map(verseTexts);
      if (verses && Array.isArray(verses) && verses.length > 0) {
        const verse = verses[0];
        newTexts.set(referenceId, `${verse.osis} - ${verse.text_content}`);
      } else {
        newTexts.set(referenceId, `Jakeen "${referenceText}" tekstiä ei löytynyt tietokannasta.`);
      }
      setVerseTexts(newTexts);
      
    } catch (error) {
      console.error('Error fetching verse text:', error);
      const newTexts = new Map(verseTexts);
      newTexts.set(referenceId, `Virhe ladattaessa jakeen "${referenceText}" tekstiä.`);
      setVerseTexts(newTexts);
    } finally {
      const newLoading = new Set(loadingVerses);
      newLoading.delete(referenceId);
      setLoadingVerses(newLoading);
    }
  };

  if (loading) {
    return (
      <>
        <AppSidebar 
          onNavigateToContinueAudio={() => navigate('/')}
          onNavigateToContinueText={() => navigate('/')}
          onNavigateToSummaries={() => navigate('/summaries')}
          selectedVerse={null}
        />
        <div 
          className="flex-1 flex items-center justify-center"
          onMouseEnter={() => setOpen(false)}
        >
          <div className="text-center py-12">
            <div className="text-muted-foreground">Ladataan koosteitasi...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AppSidebar 
        onNavigateToContinueAudio={() => navigate('/')}
        onNavigateToContinueText={() => navigate('/')}
        onNavigateToSummaries={() => navigate('/summaries')}
        selectedVerse={null}
      />

      <div 
        className="flex-1 flex flex-col"
        onMouseEnter={() => setOpen(false)}
      >
          {/* Go Back Button */}
          <div className="bg-background border-b border-border/50 px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Takaisin
            </Button>
          </div>

          {/* Top Header */}
          <header className="bg-background border-b border-border p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Vapaa haku..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                />
              </div>
              
              <Link 
                to="/" 
                className="text-xl font-bold text-foreground hover:text-primary transition-colors whitespace-nowrap"
              >
                Raamattu Nyt
              </Link>
            </div>
          </header>

          <div className="container mx-auto p-6 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Koosteet</h1>
                <p className="text-muted-foreground mt-1">
                  Hallitse ja järjestä Raamatun jakeita aiheittain
                </p>
              </div>
              <Button onClick={createNewSummary} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Luo uusi kooste
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Latest Summary (Main content) */}
              <div className="lg:col-span-2">
                {latestSummary ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {editingTitle ? (
                            <div className="flex items-center gap-2 mb-2">
                              <Input
                                value={editTitleValue}
                                onChange={(e) => setEditTitleValue(e.target.value)}
                                className="text-xl font-semibold"
                                onKeyPress={(e) => e.key === 'Enter' && saveTitle()}
                              />
                              <Button size="sm" onClick={saveTitle}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelTitleEdit}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <CardTitle className="flex items-center gap-2 group">
                              <FileText className="h-5 w-5" />
                              {latestSummary.title}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={startEditingTitle}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </CardTitle>
                          )}
                          <CardDescription className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(latestSummary.updated_at), 'dd.MM.yyyy HH:mm', { locale: fi })}
                            </span>
                            <Badge variant="secondary">Viimeisin</Badge>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {latestSummary.groups.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Tämä kooste on tyhjä.</p>
                          <p className="text-sm mt-1">Lisää ryhmiä ja raamatunviittauksia aloittaaksesi.</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {latestSummary.groups.map((group) => (
                            <div key={group.id} className="border rounded-lg p-4">
                              {editingSubtitle === group.id ? (
                                <div className="flex items-center gap-2 mb-2">
                                  <Input
                                    value={editSubtitleValue}
                                    onChange={(e) => setEditSubtitleValue(e.target.value)}
                                    className="font-semibold"
                                    onKeyPress={(e) => e.key === 'Enter' && saveSubtitle()}
                                  />
                                  <Button size="sm" onClick={saveSubtitle}>
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelSubtitleEdit}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 mb-2 group">
                                  <h3 className="font-semibold text-lg">{group.subtitle}</h3>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEditingSubtitle(group.id, group.subtitle)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                              
                              {/* Text content editing */}
                              {editingTextContent === group.id ? (
                                <div className="mb-3">
                                  <Textarea
                                    value={editTextContentValue}
                                    onChange={(e) => setEditTextContentValue(e.target.value)}
                                    placeholder="Lisää vapaamuotoista tekstiä tähän ryhmään..."
                                    className="min-h-[100px] mb-2"
                                  />
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={saveTextContent}>
                                      <Check className="h-4 w-4 mr-1" />
                                      Tallenna
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={cancelTextContentEdit}>
                                      <X className="h-4 w-4 mr-1" />
                                      Peruuta
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="mb-3 group/text">
                                  {group.text_content ? (
                                    <div className="relative">
                                      <p className="text-muted-foreground whitespace-pre-wrap">{group.text_content}</p>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => startEditingTextContent(group.id, group.text_content)}
                                        className="absolute top-0 right-0 opacity-0 group-hover/text:opacity-100 transition-opacity"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => startEditingTextContent(group.id, null)}
                                      className="text-muted-foreground hover:text-foreground text-xs"
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Lisää tekstisisältö
                                    </Button>
                                  )}
                                </div>
                              )}
                               {group.bible_references.length > 0 && (
                                <div className="space-y-1">
                                  <h4 className="text-sm font-medium text-muted-foreground">Raamatunviittaukset:</h4>
                                   <ul className="space-y-2">
                                     {group.bible_references.map((ref) => (
                                       <li key={ref.id} className="group">
                                         <div className="flex items-center gap-2">
                                           <Button
                                             size="sm"
                                             variant="ghost"
                                             onClick={() => toggleVerseExpansion(ref.id, ref.reference_text)}
                                             className="h-6 w-6 p-0 flex-shrink-0"
                                             disabled={loadingVerses.has(ref.id)}
                                           >
                                             {loadingVerses.has(ref.id) ? (
                                               <div className="h-3 w-3 border border-muted-foreground border-t-transparent rounded-full animate-spin" />
                                             ) : expandedVerses.has(ref.id) ? (
                                               <EyeOff className="h-3 w-3" />
                                             ) : (
                                               <Eye className="h-3 w-3" />
                                             )}
                                           </Button>
                                           <span className="text-sm flex-1">• {ref.reference_text}</span>
                                           
                                           {/* Move to group dropdown */}
                                           {latestSummary && latestSummary.groups.length > 1 && (
                                             <Select
                                               value={group.id}
                                               onValueChange={(newGroupId) => moveBibleReference(ref.id, newGroupId, ref.reference_text)}
                                             >
                                               <SelectTrigger className="h-6 w-auto gap-1 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity border-muted-foreground/30">
                                                 <MoveRight className="h-3 w-3" />
                                               </SelectTrigger>
                                               <SelectContent>
                                                 {latestSummary.groups.map((g) => (
                                                   <SelectItem 
                                                     key={g.id} 
                                                     value={g.id}
                                                     disabled={g.id === group.id}
                                                   >
                                                     {g.subtitle} {g.id === group.id && "(nykyinen)"}
                                                   </SelectItem>
                                                 ))}
                                               </SelectContent>
                                             </Select>
                                           )}
                                           
                                           <Button
                                             size="sm"
                                             variant="ghost"
                                             onClick={() => deleteBibleReference(ref.id)}
                                             className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive h-6 w-6 p-0"
                                           >
                                             <Trash2 className="h-3 w-3" />
                                           </Button>
                                         </div>
                                         {expandedVerses.has(ref.id) && verseTexts.has(ref.id) && (
                                           <div className="ml-8 mt-2 p-3 bg-muted/50 rounded-md border-l-2 border-primary/30">
                                             <p className="text-sm leading-relaxed text-foreground">
                                               {verseTexts.get(ref.id)}
                                             </p>
                                           </div>
                                         )}
                                       </li>
                                     ))}
                                   </ul>
                                </div>
                               )}
                            </div>
                          ))}
                          
                          {/* Add new subtitle section */}
                          <div className="border rounded-lg p-4 bg-muted/30">
                            {addingNewSubtitle ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  placeholder="Uuden alaotsikon nimi..."
                                  value={newSubtitleValue}
                                  onChange={(e) => setNewSubtitleValue(e.target.value)}
                                  onKeyPress={(e) => e.key === 'Enter' && saveNewSubtitle()}
                                />
                                <Button size="sm" onClick={saveNewSubtitle}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelNewSubtitle}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                onClick={startAddingNewSubtitle}
                                className="w-full justify-start text-muted-foreground hover:text-foreground"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Lisää uusi alaotsikko
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h2 className="text-xl font-semibold mb-2">Ei koosteitasi vielä</h2>
                      <p className="text-muted-foreground mb-4">
                        Luo ensimmäinen koosteesi aloittaaksesi Raamatun jakeiden järjestelyn aiheittain.
                      </p>
                      <Button onClick={createNewSummary} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Luo ensimmäinen kooste
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Summaries List (Sidebar) */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Kaikki koosteet</CardTitle>
                    <CardDescription>
                      {summaries.length} {summaries.length === 1 ? 'kooste' : 'koostetta'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {summaries.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        <p className="text-sm">Ei koosteitasi</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {summaries.map((summary, index) => (
                          <div
                            key={summary.id}
                            className={`p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors ${
                              index === 0 ? 'bg-primary/5 border-primary/20' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm line-clamp-1">
                                  {summary.title}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(summary.updated_at), 'dd.MM.yyyy', { locale: fi })}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {summary.groups.length} ryhmää
                                  </Badge>
                                  {index === 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                      Viimeisin
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </>
  );
};

const SummaryPage = () => {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <SummaryContent />
      </div>
    </SidebarProvider>
  );
};

export default SummaryPage;