import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WidgetConfigPageContent = () => {
  const { toast } = useToast();
  const [appUrl, setAppUrl] = useState("https://9cae91d3-5fc1-4587-a550-1da914e11c66.lovableproject.com");
  const [embedUrl, setEmbedUrl] = useState("https://iryqgmjauybluwnqhxbg.supabase.co/functions/v1/embed");
  const [copied, setCopied] = useState<string | null>(null);

  // Empty handlers for sidebar (not needed on config page)
  const handleNavigateToContinueAudio = () => {};
  const handleNavigateToContinueText = () => {};

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
            {/* App URL Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Sovelluksen URL</CardTitle>
                <CardDescription>
                  Tämä URL-osoite käytetään widgetin linkeissä, jotka ohjaavat käyttäjät sovellukseen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="app-url">App URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="app-url"
                      value={appUrl}
                      onChange={(e) => setAppUrl(e.target.value)}
                      placeholder="https://yourdomain.com"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(appUrl, "App URL")}
                    >
                      {copied === "App URL" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Huom: Muutokset vaativat myös APP_URL environment variablen päivitystä edge funktiossa
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Embed API Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Embed API URL</CardTitle>
                <CardDescription>
                  Edge function URL josta widget hakee raamattujakeiden tiedot
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="embed-url">Embed API URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="embed-url"
                      value={embedUrl}
                      onChange={(e) => setEmbedUrl(e.target.value)}
                      placeholder="https://your-project.supabase.co/functions/v1/embed"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(embedUrl, "Embed API URL")}
                    >
                      {copied === "Embed API URL" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tämä URL pitää päivittää myös widget.js tiedostossa (API_BASE_URL)
                  </p>
                </div>
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
              </CardContent>
            </Card>

            {/* Test Page */}
            <Card>
              <CardHeader>
                <CardTitle>Testisivu</CardTitle>
                <CardDescription>
                  Avaa testisivu nähdäksesi widgetin toiminnassa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <a href={testPageUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Avaa testisivu
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Documentation Links */}
            <Card>
              <CardHeader>
                <CardTitle>Dokumentaatio</CardTitle>
                <CardDescription>
                  Lisätietoja widgetin käytöstä
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <a
                    href="https://github.com/yourusername/raamattu-widget#readme"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    README.md - Täydellinen dokumentaatio
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={testPageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    widget-test.html - Esimerkkejä
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Important Notes */}
            <Card className="border-warning">
              <CardHeader>
                <CardTitle className="text-warning">⚠️ Tärkeää</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <strong>Environment Variablet:</strong> APP_URL pitää asettaa edge funktiossa (Supabase Secrets)
                </p>
                <p>
                  <strong>Widget.js päivitys:</strong> Jos vaihdat Embed API URL:ia, muista päivittää myös 
                  <code className="bg-muted px-1 py-0.5 rounded mx-1">public/widget.js</code> 
                  tiedoston API_BASE_URL vakio
                </p>
                <p>
                  <strong>CORS:</strong> Varmista että embed edge funktio sallii CORS-pyynnöt kaikilta domaineista
                </p>
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
