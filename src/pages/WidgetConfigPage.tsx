import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

const WidgetConfigPageContent = () => {
  const { toast } = useToast();
  const [appUrl, setAppUrl] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Empty handlers for sidebar (not needed on config page)
  const handleNavigateToContinueAudio = () => {};
  const handleNavigateToContinueText = () => {};

  // Load settings from database
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['app_url', 'embed_api_url']);

      if (error) throw error;

      if (data) {
        const settings = Object.fromEntries(data.map(s => [s.key, s.value]));
        setAppUrl(settings.app_url || '');
        setEmbedUrl(settings.embed_api_url || '');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Virhe",
        description: "Asetusten lataaminen epäonnistui",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const updates = [
        { key: 'app_url', value: appUrl },
        { key: 'embed_api_url', value: embedUrl }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('app_settings')
          .update({ value: update.value })
          .eq('key', update.key);

        if (error) throw error;
      }

      toast({
        title: "Tallennettu",
        description: "Asetukset tallennettu onnistuneesti!",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Virhe",
        description: "Asetusten tallennus epäonnistui",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const widgetCode = `<!-- Lisää tämä sivun <head>-osioon -->
<script src="${appUrl}/widget.js" defer></script>

<!-- Käytä widgetiä missä tahansa sivun osassa -->
<div class="rn-bible" data-ref="Joh.3:16"></div>
<div class="rn-bible" data-ref="1.Moos.1:1-3" data-version="finpr_finn"></div>`;

  const testPageUrl = `${appUrl}/widget-test.html`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast({
      title: "Kopioitu leikepöydälle",
      description: `${label} kopioitu.`,
    });
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar 
          onNavigateToContinueAudio={handleNavigateToContinueAudio}
          onNavigateToContinueText={handleNavigateToContinueText}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 max-w-4xl">
            <p className="text-muted-foreground">Ladataan asetuksia...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar 
        onNavigateToContinueAudio={handleNavigateToContinueAudio}
        onNavigateToContinueText={handleNavigateToContinueText}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">Widget-asetukset</h1>
            <p className="text-muted-foreground">
              Hallitse Raamattu Widget -asetuksia ja embedding-konfiguraatiota
            </p>
          </div>

          <div className="space-y-6">
            {/* Configuration Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Yleiset asetukset</CardTitle>
                <CardDescription>
                  Määritä sovelluksen URL-osoitteet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="app-url">Sovelluksen URL</Label>
                  <Input
                    id="app-url"
                    value={appUrl}
                    onChange={(e) => setAppUrl(e.target.value)}
                    placeholder="https://yourdomain.com"
                  />
                  <p className="text-sm text-muted-foreground">
                    Käytetään widget-linkeissä ohjaamaan käyttäjät sovellukseen
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="embed-url">Embed API URL</Label>
                  <Input
                    id="embed-url"
                    value={embedUrl}
                    onChange={(e) => setEmbedUrl(e.target.value)}
                    placeholder="https://project.supabase.co/functions/v1/embed"
                  />
                  <p className="text-sm text-muted-foreground">
                    Edge Function osoite joka palvelee widget-dataa
                  </p>
                </div>

                <Button onClick={saveSettings} disabled={saving} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Tallennetaan..." : "Tallenna asetukset"}
                </Button>
              </CardContent>
            </Card>

            {/* Widget Code */}
            <Card>
              <CardHeader>
                <CardTitle>Widget-koodi</CardTitle>
                <CardDescription>
                  Kopioi tämä koodi sivuillesi käyttääksesi widgetiä
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{widgetCode}</code>
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(widgetCode, "Widget-koodi")}
                  >
                    {copied === "Widget-koodi" ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Kopioitu
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Kopioi
                      </>
                    )}
                  </Button>
                </div>
                <Alert>
                  <AlertDescription>
                    <strong>Huom:</strong> Widgetin käyttö edellyttää widget.js -tiedoston päivitystä,
                    jos muutat Embed API URL:ia. Tiedosto sijaitsee public/widget.js -kansiossa.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Test Page Link */}
            <Card>
              <CardHeader>
                <CardTitle>Testisivu</CardTitle>
                <CardDescription>
                  Testaa widgetin toimintaa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={() => window.open(testPageUrl, '_blank')}
                  className="w-full"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Avaa testisivu
                </Button>
              </CardContent>
            </Card>

            {/* Documentation */}
            <Card>
              <CardHeader>
                <CardTitle>Dokumentaatio</CardTitle>
                <CardDescription>
                  Widgetin käyttöohje ja esimerkit
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Tuetut viittausmuodot:</h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Yksittäinen jae: <code className="text-foreground">Joh.3:16</code></li>
                    <li>Jaeväli: <code className="text-foreground">1.Moos.1:1-3</code></li>
                    <li>Lyhyet lyhenteet: <code className="text-foreground">Joh.3:16</code></li>
                    <li>Pitkät lyhenteet: <code className="text-foreground">Johannes 3:16</code></li>
                    <li>Numeroidut kirjat: <code className="text-foreground">1.Moos</code> tai <code className="text-foreground">1 Moos</code></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Parametrit:</h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li><code className="text-foreground">data-ref</code>: Raamatunpaikka (pakollinen)</li>
                    <li><code className="text-foreground">data-version</code>: Käännösversio (valinnainen, oletus: finstlk201)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

const WidgetConfigPage = () => {
  return (
    <SidebarProvider>
      <WidgetConfigPageContent />
    </SidebarProvider>
  );
};

export default WidgetConfigPage;
