import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, ChevronDown, ChevronRight, ArrowLeft, Music, Clock, Database, Loader2, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ELEVENLABS_VOICES, getVoiceReaderKey } from "@/lib/elevenLabsVoices";

interface AudioAsset {
  id: string;
  chapter_id: string;
  version_id: string;
  version_code: string | null;
  voice: string | null;
  reader_key: string | null;
  file_url: string;
  duration_ms: number | null;
  created_at?: string;
}

interface AudioCue {
  id: string;
  audio_id: string;
  verse_id: string;
  start_ms: number;
  end_ms: number | null;
}

interface BookStats {
  book_name: string;
  book_order: number;
  total_chapters: number;
  chapters_with_audio: number;
  version_code: string;
}

interface AudioAssetWithDetails extends AudioAsset {
  book_name?: string;
  chapter_number?: number;
  cues_count?: number;
}

export default function AdminAudioPage() {
  const [bookStats, setBookStats] = useState<BookStats[]>([]);
  const [audioAssets, setAudioAssets] = useState<AudioAssetWithDetails[]>([]);
  const [selectedAudioId, setSelectedAudioId] = useState<string | null>(null);
  const [audioCues, setAudioCues] = useState<AudioCue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedBooks, setExpandedBooks] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Generation form state
  const [genBooks, setGenBooks] = useState<{ id: string; name: string; chapters_count: number; version_id: string }[]>([]);
  const [genVersions, setGenVersions] = useState<{ id: string; code: string; name: string }[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<string>(ELEVENLABS_VOICES[0]?.voiceId || '');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadData();
    loadGenerationData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load book statistics with audio coverage
      await loadStatsManually();

      // Load all audio assets with details
      const { data: assetsData, error: assetsError } = await supabase
        .from('audio_assets')
        .select('*')
        .order('version_code', { ascending: true });

      if (assetsError) throw assetsError;

      // Enrich with chapter/book details
      const enrichedAssets = await enrichAudioAssets(assetsData || []);
      setAudioAssets(enrichedAssets);

    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: "Virhe",
        description: "Datan lataus epäonnistui",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadGenerationData = async () => {
    try {
      // Load versions
      const { data: versions } = await (supabase as any)
        .schema('bible_schema')
        .from('bible_versions')
        .select('id, code, name')
        .eq('is_active', true)
        .order('code');
      
      setGenVersions(versions || []);
      if (versions && versions.length > 0) {
        setSelectedVersion(versions[0].id);
      }
    } catch (error) {
      console.error('Error loading generation data:', error);
    }
  };

  // Load books when version changes
  useEffect(() => {
    const loadBooks = async () => {
      if (!selectedVersion) return;
      
      const { data: books } = await (supabase as any)
        .schema('bible_schema')
        .from('books')
        .select('id, name, chapters_count, version_id')
        .eq('version_id', selectedVersion)
        .order('book_order');
      
      setGenBooks(books || []);
      setSelectedBook('');
      setSelectedChapter('');
    };
    loadBooks();
  }, [selectedVersion]);

  const generateAudio = async () => {
    if (!selectedBook || !selectedChapter || !selectedVoice || !selectedVersion) {
      toast({
        title: "Täytä kaikki kentät",
        variant: "destructive"
      });
      return;
    }

    // Find chapter_id from bible_schema
    const { data: chapters } = await (supabase as any)
      .schema('bible_schema')
      .from('chapters')
      .select('id')
      .eq('book_id', selectedBook)
      .eq('chapter_number', parseInt(selectedChapter));

    if (!chapters || chapters.length === 0) {
      toast({
        title: "Lukua ei löytynyt",
        variant: "destructive"
      });
      return;
    }

    const chapter_id = chapters[0].id;
    const reader_key = getVoiceReaderKey(selectedVoice);

    setIsGenerating(true);
    try {
      const response = await supabase.functions.invoke('generate-audio', {
        body: {
          chapter_id,
          version_id: selectedVersion,
          reader_key
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Audio generoitu",
        description: response.data.from_cache ? "Käytettiin välimuistia" : "Uusi audio luotu"
      });

      // Reload data
      loadData();
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: "Generointi epäonnistui",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const loadStatsManually = async () => {
    try {
      // Get all books from bible_schema
      const { data: books, error: booksError } = await (supabase as any)
        .schema('bible_schema')
        .from('books')
        .select('id, name, book_order, chapters_count, version_id')
        .order('book_order');

      if (booksError) {
        console.error('Books query error:', booksError);
        return;
      }

      // Get all versions
      const { data: versions } = await (supabase as any)
        .schema('bible_schema')
        .from('bible_versions')
        .select('id, code');

      const versionMap = new Map<string, string>(versions?.map((v: any) => [v.id, v.code]) || []);

      // Get chapters that have audio
      const { data: audioChapters, error: audioError } = await supabase
        .from('audio_assets')
        .select('chapter_id, version_id');

      if (audioError) {
        console.error('Audio query error:', audioError);
      }

      const chapterSet = new Set(audioChapters?.map(a => a.chapter_id) || []);

      // Get chapter IDs for each book from bible_schema
      const { data: chapters, error: chaptersError } = await (supabase as any)
        .schema('bible_schema')
        .from('chapters')
        .select('id, book_id');

      if (chaptersError) {
        console.error('Chapters query error:', chaptersError);
      }

      const bookChapterMap = new Map<string, string[]>();
      chapters?.forEach((c: any) => {
        const existing = bookChapterMap.get(c.book_id) || [];
        existing.push(c.id);
        bookChapterMap.set(c.book_id, existing);
      });

      const stats: BookStats[] = (books || []).map((book: any) => {
        const bookChapters = bookChapterMap.get(book.id) || [];
        const chaptersWithAudio = bookChapters.filter(cid => chapterSet.has(cid)).length;
        
        return {
          book_name: book.name,
          book_order: book.book_order,
          total_chapters: book.chapters_count,
          chapters_with_audio: chaptersWithAudio,
          version_code: versionMap.get(book.version_id) || 'unknown'
        };
      });

      setBookStats(stats);
    } catch (error) {
      console.error('loadStatsManually error:', error);
    }
  };

  const enrichAudioAssets = async (assets: AudioAsset[]): Promise<AudioAssetWithDetails[]> => {
    if (assets.length === 0) return [];

    const chapterIds = [...new Set(assets.map(a => a.chapter_id))];
    const versionIds = [...new Set(assets.map(a => a.version_id))];
    
    // Get chapter details from bible_schema
    const { data: chapters } = await (supabase as any)
      .schema('bible_schema')
      .from('chapters')
      .select('id, chapter_number, book_id')
      .in('id', chapterIds);

    const bookIds = [...new Set(chapters?.map((c: any) => c.book_id) || [])];
    
    // Get book names from bible_schema
    const { data: books } = await (supabase as any)
      .schema('bible_schema')
      .from('books')
      .select('id, name')
      .in('id', bookIds);

    // Get version codes from bible_schema
    const { data: versions } = await (supabase as any)
      .schema('bible_schema')
      .from('bible_versions')
      .select('id, code')
      .in('id', versionIds);

    const chapterMap = new Map<string, any>(chapters?.map((c: any) => [c.id, c]) || []);
    const bookMap = new Map<string, string>(books?.map((b: any) => [b.id, b.name]) || []);
    const versionMap = new Map<string, string>(versions?.map((v: any) => [v.id, v.code]) || []);

    // Get cues count per audio
    const { data: cuesCounts } = await supabase
      .from('audio_cues')
      .select('audio_id');

    const cuesCountMap = new Map<string, number>();
    cuesCounts?.forEach(c => {
      cuesCountMap.set(c.audio_id, (cuesCountMap.get(c.audio_id) || 0) + 1);
    });

    return assets.map(asset => {
      const chapter = chapterMap.get(asset.chapter_id);
      const bookName = chapter ? bookMap.get(chapter.book_id) : undefined;
      const versionCode = versionMap.get(asset.version_id) || asset.version_code;
      
      return {
        ...asset,
        book_name: bookName as string | undefined,
        chapter_number: chapter?.chapter_number as number | undefined,
        version_code: versionCode as string | null,
        cues_count: cuesCountMap.get(asset.id) || 0
      };
    });
  };

  const loadAudioCues = async (audioId: string) => {
    setSelectedAudioId(audioId);
    
    const { data, error } = await supabase
      .from('audio_cues')
      .select('*')
      .eq('audio_id', audioId)
      .order('start_ms', { ascending: true });

    if (error) {
      toast({
        title: "Virhe",
        description: "Audio cues -lataus epäonnistui",
        variant: "destructive"
      });
      return;
    }

    setAudioCues(data || []);
  };

  const deleteAudioAsset = async (assetId: string) => {
    if (!confirm('Haluatko varmasti poistaa tämän audio-tiedoston ja sen cues?')) {
      return;
    }

    try {
      // Delete cues first
      await supabase.from('audio_cues').delete().eq('audio_id', assetId);
      
      // Delete asset
      const { error } = await supabase.from('audio_assets').delete().eq('id', assetId);
      
      if (error) throw error;

      toast({
        title: "Poistettu",
        description: "Audio-tiedosto ja cues poistettu"
      });

      // Refresh data
      loadData();
      if (selectedAudioId === assetId) {
        setSelectedAudioId(null);
        setAudioCues([]);
      }
    } catch (error: any) {
      toast({
        title: "Virhe",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteAllAudio = async () => {
    if (!confirm('Haluatko varmasti poistaa KAIKKI audio-tiedostot ja cues? Tätä ei voi perua.')) {
      return;
    }

    try {
      await supabase.from('audio_cues').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('audio_assets').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      toast({
        title: "Poistettu",
        description: "Kaikki audio-data poistettu"
      });

      loadData();
      setSelectedAudioId(null);
      setAudioCues([]);
    } catch (error: any) {
      toast({
        title: "Virhe",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const toggleBook = (bookName: string) => {
    const newExpanded = new Set(expandedBooks);
    if (newExpanded.has(bookName)) {
      newExpanded.delete(bookName);
    } else {
      newExpanded.add(bookName);
    }
    setExpandedBooks(newExpanded);
  };

  // Group assets by book
  const assetsByBook = audioAssets.reduce((acc, asset) => {
    const key = asset.book_name || 'Tuntematon';
    if (!acc[key]) acc[key] = [];
    acc[key].push(asset);
    return acc;
  }, {} as Record<string, AudioAssetWithDetails[]>);

  const totalAudioCount = audioAssets.length;
  const totalCuesCount = audioAssets.reduce((sum, a) => sum + (a.cues_count || 0), 0);
  const booksWithAudio = Object.keys(assetsByBook).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Takaisin
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Audio Admin</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Audio-tiedostoja</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Music className="h-6 w-6 text-primary" />
                {totalAudioCount}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Audio Cues</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Clock className="h-6 w-6 text-primary" />
                {totalCuesCount}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Kirjoja audiolla</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Database className="h-6 w-6 text-primary" />
                {booksWithAudio}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Toiminnot</CardDescription>
              <CardContent className="p-0 pt-2">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={deleteAllAudio}
                  disabled={totalAudioCount === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Poista kaikki
                </Button>
              </CardContent>
            </CardHeader>
          </Card>
        </div>

        {/* Audio Generation Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Generoi audio
            </CardTitle>
            <CardDescription>Generoi audio valitulle luvulle ElevenLabs TTS:llä</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div className="space-y-2">
                <Label>Versio</Label>
                <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Valitse versio" />
                  </SelectTrigger>
                  <SelectContent>
                    {genVersions.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.code} - {v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kirja</Label>
                <Select value={selectedBook} onValueChange={(val) => { setSelectedBook(val); setSelectedChapter(''); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Valitse kirja" />
                  </SelectTrigger>
                  <SelectContent>
                    {genBooks.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Luku</Label>
                <Select value={selectedChapter} onValueChange={setSelectedChapter} disabled={!selectedBook}>
                  <SelectTrigger>
                    <SelectValue placeholder="Valitse luku" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedBook && genBooks.find(b => b.id === selectedBook) && 
                      Array.from({ length: genBooks.find(b => b.id === selectedBook)!.chapters_count }, (_, i) => i + 1).map(ch => (
                        <SelectItem key={ch} value={ch.toString()}>{ch}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ääni</Label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Valitse ääni" />
                  </SelectTrigger>
                  <SelectContent>
                    {ELEVENLABS_VOICES.map(v => (
                      <SelectItem key={v.voiceId} value={v.voiceId}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={generateAudio} 
                disabled={isGenerating || !selectedBook || !selectedChapter}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generoidaan...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Generoi
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Book Statistics */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Audio-kattavuus kirjoittain</CardTitle>
            <CardDescription>Kuinka monta lukua kustakin kirjasta on generoitu</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Ladataan...</p>
            ) : Object.keys(assetsByBook).length === 0 ? (
              <p className="text-muted-foreground">Ei vielä generoitua audiota</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {Object.entries(assetsByBook)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([bookName, assets]) => {
                    const versionCode = assets[0]?.version_code || 'unknown';
                    return (
                      <div 
                        key={`${bookName}-${versionCode}`}
                        className="p-2 border rounded-md text-sm"
                      >
                        <div className="font-medium truncate" title={bookName}>
                          {bookName}
                        </div>
                        <div className="text-muted-foreground">
                          {assets.length} lukua
                        </div>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {versionCode}
                        </Badge>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audio Assets by Book */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Audio-tiedostot</CardTitle>
            <CardDescription>Klikkaa kirjaa nähdäksesi luvut</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Ladataan...</p>
            ) : audioAssets.length === 0 ? (
              <p className="text-muted-foreground">Ei audio-tiedostoja</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(assetsByBook)
                  .sort(([, a], [, b]) => (a[0]?.book_name || '').localeCompare(b[0]?.book_name || ''))
                  .map(([bookName, assets]) => (
                    <Collapsible 
                      key={bookName}
                      open={expandedBooks.has(bookName)}
                      onOpenChange={() => toggleBook(bookName)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between">
                          <span className="flex items-center gap-2">
                            {expandedBooks.has(bookName) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            {bookName}
                          </span>
                          <Badge variant="secondary">{assets.length} lukua</Badge>
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Luku</TableHead>
                              <TableHead>Versio</TableHead>
                              <TableHead>Ääni</TableHead>
                              <TableHead>Kesto</TableHead>
                              <TableHead>Cues</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {assets
                              .sort((a, b) => (a.chapter_number || 0) - (b.chapter_number || 0))
                              .map(asset => (
                                <TableRow 
                                  key={asset.id}
                                  className={selectedAudioId === asset.id ? 'bg-muted' : ''}
                                >
                                  <TableCell>{asset.chapter_number}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{asset.version_code}</Badge>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {asset.reader_key || asset.voice || '-'}
                                  </TableCell>
                                  <TableCell>{formatDuration(asset.duration_ms)}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="link"
                                      size="sm"
                                      onClick={() => loadAudioCues(asset.id)}
                                    >
                                      {asset.cues_count || 0}
                                    </Button>
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteAudioAsset(asset.id)}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audio Cues Detail */}
        {selectedAudioId && (
          <Card>
            <CardHeader>
              <CardTitle>Audio Cues</CardTitle>
              <CardDescription>
                {audioCues.length} cue-merkintää
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Verse ID</TableHead>
                    <TableHead>Alku (ms)</TableHead>
                    <TableHead>Loppu (ms)</TableHead>
                    <TableHead>Kesto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audioCues.map((cue, index) => (
                    <TableRow key={cue.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {cue.verse_id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>{cue.start_ms}</TableCell>
                      <TableCell>{cue.end_ms || '-'}</TableCell>
                      <TableCell>
                        {cue.end_ms ? `${cue.end_ms - cue.start_ms}ms` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
