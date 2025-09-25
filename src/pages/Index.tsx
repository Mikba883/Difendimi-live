import { Shield, ArrowRight, CheckCircle, Lock, Scale, Clock, Download, Brain, FileText, Zap, Users, Star, MessageSquare, ChevronRight, ClipboardList, FileCheck, Target, Calendar, Paperclip, Check, X, Eye, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InstallPWA } from "@/components/InstallPWA";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ReportSections } from "@/components/case/ReportSections";
import { DEMO_CASE_DATA } from "@/data/demoCase";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Index = () => {
  const navigate = useNavigate();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check auth status first
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
        return;
      }
    };
    
    checkAuth();

    // Check if running on iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app was installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [navigate]);

  const [showPreview, setShowPreview] = useState(false);
  const [showInstallSheet, setShowInstallSheet] = useState(false);

  const handleMainButtonClick = async () => {
    // Se l'app è già installata o siamo in modalità standalone, vai al login
    if (isInstalled || window.matchMedia('(display-mode: standalone)').matches) {
      navigate("/login");
      return;
    }

    // Se c'è il prompt di installazione disponibile, installala
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        
        if (outcome === 'accepted') {
          setInstallPrompt(null);
          // Dopo l'installazione, naviga al login
          setTimeout(() => navigate("/login"), 500);
        }
      } catch (error) {
        console.error('Error installing PWA:', error);
        // Se c'è un errore, vai comunque al login
        navigate("/login");
      }
    } else if (isIOS) {
      // Su iOS mostra un alert con le istruzioni
      alert("Per installare l'app:\n1. Tocca il pulsante Condividi ⬆️\n2. Scorri e tocca 'Aggiungi a Home'\n3. Tocca 'Aggiungi'");
      // Poi vai al login
      navigate("/login");
    } else {
      // Se non c'è modo di installare, vai direttamente al login
      navigate("/login");
    }
  };

  const handleDownloadApp = async () => {
    // Se c'è il prompt di installazione, usalo
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
          setInstallPrompt(null);
        }
      } catch (error) {
        console.error('Error installing PWA:', error);
        setShowInstallSheet(true);
      }
    } else if (isIOS) {
      setShowInstallSheet(true);
    } else {
      // Mostra istruzioni generiche
      setShowInstallSheet(true);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with gradient background that extends to header */}
      <div className="relative bg-gradient-to-br from-orange-400 via-rose-400 to-purple-500">
        {/* Header */}
        <header className="fixed top-0 w-full backdrop-blur-md bg-background/10 border-b border-white/10 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">
                  Difendimi.AI
                </h1>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleDownloadApp}
                  variant="outline"
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Scarica l'app
                </Button>
                <Button 
                  onClick={() => navigate("/login")}
                  className="bg-white text-primary hover:bg-white/90 transition-all shadow-elegant"
                >
                  Accedi
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full mb-6">
                <Zap className="h-4 w-4 text-white" />
                <span className="text-sm font-medium text-white">Fai valere i tuoi diritti</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in text-white">
                Scopri cosa dice la
                <span className="text-white"> legge</span>
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8 animate-fade-in" style={{animationDelay: "0.1s"}}>
                Senza attese, senza parcelle, con l'intelligenza artificiale
              </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{animationDelay: "0.2s"}}>
              <Button 
                size="lg"
                onClick={() => navigate("/case/new")}
                className="bg-white text-primary hover:bg-white/90 shadow-elegant px-8"
              >
                Analizza subito il tuo caso
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-8 mt-12 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-white" />
                <span>100% Anonimo</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-white" />
                <span>Privacy Garantita</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-white" />
                <span>AI Avanzata</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    {/* Come Funziona Section */}
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Come <span className="bg-gradient-primary bg-clip-text text-transparent">Funziona</span>
          </h2>
          <p className="text-xl text-muted-foreground">Tre semplici passi verso la chiarezza legale</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="group hover:shadow-elegant transition-all duration-300 border-border/50 bg-gradient-card">
            <CardContent className="pt-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">1</span>
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Racconta il tuo caso</h3>
              <p className="text-muted-foreground">
                Descrivi la situazione con parole tue. L'AI comprenderà e ti guiderà.
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-elegant transition-all duration-300 border-border/50 bg-gradient-card">
            <CardContent className="pt-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">2</span>
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Analisi intelligente</h3>
              <p className="text-muted-foreground">
                Il sistema consulta la normativa vigente italiana ed europea.
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-elegant transition-all duration-300 border-border/50 bg-gradient-card">
            <CardContent className="pt-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">3</span>
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Ricevi documenti</h3>
              <p className="text-muted-foreground">
                Ottieni schede informative chiare e PDF scaricabili.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>

    {/* Comparison Section */}
    <section className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Perché Difendimi è <span className="bg-gradient-primary bg-clip-text text-transparent">diverso</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Confronto tra Difendimi.AI e le AI generiche
          </p>
        </div>
        
        <Card className="max-w-6xl mx-auto overflow-hidden border-primary/20">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5">
                  <TableHead className="font-bold text-foreground">Caratteristica</TableHead>
                  <TableHead className="font-bold text-center text-primary">Difendimi.AI</TableHead>
                  <TableHead className="font-bold text-center text-muted-foreground">ChatGPT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Focus</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="default" className="bg-primary/10 text-primary">
                      Specializzato sul diritto italiano ed europeo
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    Generalista, copre qualsiasi argomento
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Affidabilità normativa</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Check className="h-5 w-5 text-primary" />
                      <span>Consulta banche dati ufficiali (Normattiva, EUR-Lex, ecc.)</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <X className="h-5 w-5 text-muted-foreground" />
                      <span className="text-muted-foreground">Non ha accesso diretto a banche dati giuridiche ufficiali</span>
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Output</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="default" className="bg-primary/10 text-primary">
                      Documenti pratici (schede, dossier PDF, bozze email/diffide)
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    Risposte testuali generiche
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Personalizzazione</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Check className="h-5 w-5 text-primary" />
                      <span>Analisi del tuo caso specifico e guida passo passo</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    Risposte standard, non sempre contestualizzate alla normativa vigente
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Usabilità</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="default" className="bg-primary/10 text-primary">
                      Interfaccia semplice, pensata per chi non è giurista
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    Richiede competenze per formulare prompt corretti
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Obiettivo</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      <span className="font-medium">Farti valere i tuoi diritti in tempi rapidi e senza parcelle</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    Rispondere in modo ampio a qualsiasi curiosità
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </section>

    {/* What You Get Section - Interactive Preview */}
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Cosa <span className="bg-gradient-primary bg-clip-text text-transparent">riceverai</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Esplora un esempio reale di analisi generata da Difendimi
          </p>
        </div>
        
        {/* Preview Card */}
        <Card className="max-w-4xl mx-auto border-primary/20 overflow-hidden">
          <CardHeader className="bg-gradient-card">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Esempio: Multa per divieto di sosta</CardTitle>
                <p className="text-muted-foreground mt-2">
                  Vedi come appare un'analisi completa del tuo caso
                </p>
              </div>
              <Badge variant="secondary" className="px-3 py-1">
                DEMO
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Mini preview of sections */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Sommario Esecutivo
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {DEMO_CASE_DATA.executive_summary?.summary}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <Scale className="h-4 w-4 text-primary" />
                    Qualifica Giuridica
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {DEMO_CASE_DATA.qualificazione_giuridica?.description}
                  </p>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  size="lg"
                  onClick={() => setShowPreview(true)}
                  className="shadow-elegant"
                >
                  <Eye className="h-5 w-5 mr-2" />
                  Vedi esempio completo
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/case/new")}
                >
                  Analizza il tuo caso
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>

    {/* FAQ Section */}
    <section className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Domande <span className="bg-gradient-primary bg-clip-text text-transparent">Frequenti</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Tutto quello che devi sapere su Difendimi
          </p>
        </div>
        
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left">
                  Che cos'è Difendimi?
                </AccordionTrigger>
                <AccordionContent>
                  Difendimi è un assistente digitale esperto in diritto che ti aiuta a capire subito cosa dice la legge sul tuo caso, senza attese né parcelle.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left">
                  Difendimi sostituisce un avvocato?
                </AccordionTrigger>
                <AccordionContent>
                  No. Difendimi non è uno studio legale e non fornisce consulenza personalizzata da parte di un avvocato. Ti aiuta però a orientarti tra le norme, a capire i tuoi diritti e a preparare la documentazione di base.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left">
                  Come funziona l'analisi del caso?
                </AccordionTrigger>
                <AccordionContent>
                  Inserisci una descrizione semplice del tuo problema. Difendimi consulta la normativa vigente italiana ed europea e genera un dossier con: sintesi del caso, riferimenti normativi, opzioni procedurali e documenti utili.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left">
                  Cosa ricevo con l'app?
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Sommario esecutivo del tuo caso</li>
                    <li>Dossier completo con riferimenti normativi</li>
                    <li>Qualifica giuridica del problema</li>
                    <li>Opzioni strategiche possibili</li>
                    <li>Passi operativi con termini e scadenze</li>
                    <li>Documenti e allegati da utilizzare</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger className="text-left">
                  I documenti sono validi legalmente?
                </AccordionTrigger>
                <AccordionContent>
                  I documenti generati sono bozze pronte all'uso (email, diffide, istanze, ecc.). Non sostituiscono un atto redatto da un avvocato, ma ti permettono di organizzarti subito e di risparmiare tempo e costi.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger className="text-left">
                  Quanto tempo ci vuole per ricevere il dossier?
                </AccordionTrigger>
                <AccordionContent>
                  Il dossier viene generato in pochi secondi, pronto da consultare o scaricare in PDF.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7">
                <AccordionTrigger className="text-left">
                  Difendimi è sicuro?
                </AccordionTrigger>
                <AccordionContent>
                  Sì. Difendimi non salva i dati dei tuoi casi e i dossier generati non contengono alcuna informazione personale o sensibile. Puoi quindi essere sicuro al 100%.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </section>

    {/* Download App Section */}
    <section className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Porta Difendimi.AI <span className="bg-gradient-primary bg-clip-text text-transparent">sempre con te</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Scarica l'app e accedi alle informazioni legali ovunque ti trovi
          </p>
        </div>
        
        <Card className="max-w-2xl mx-auto border-primary/20 bg-background/95 backdrop-blur">
          <CardContent className="p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center">
                <Download className="h-10 w-10 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4">Installa l'applicazione</h3>
            <p className="text-muted-foreground mb-8">
              Con un semplice click, installa Difendimi.AI sul tuo dispositivo e accedi rapidamente quando ne hai bisogno. Nessun download da store, installazione diretta dal browser.
            </p>
            <Button
              size="lg"
              onClick={handleMainButtonClick}
              className="bg-gradient-primary hover:opacity-90 text-white shadow-elegant px-12"
            >
              <Download className="h-5 w-5 mr-2" />
              Scarica l'app
            </Button>
            <div className="flex items-center justify-center gap-8 mt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Gratis</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>Sicura</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span>Veloce</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>

    {/* Disclaimer Section */}
    <section className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <Card className="max-w-3xl mx-auto border-primary/20 bg-background/50 backdrop-blur">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-semibold">Nota Importante</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Difendimi.AI fornisce esclusivamente informazioni educative basate su fonti ufficiali.
              Per questioni legali specifiche, consulta sempre un professionista qualificato.
              Il servizio è progettato per aiutarti a comprendere meglio le normative applicabili.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>

    {/* Footer */}
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Difendimi.AI</span>
            </div>
            <p className="text-background/70 text-sm">
              Scopri cosa dice la legge senza attese né parcelle
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Prodotto</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><a href="/features" className="hover:text-background transition">Funzionalità</a></li>
              <li><a href="/pricing" className="hover:text-background transition">Prezzi</a></li>
              <li><a href="/faq" className="hover:text-background transition">FAQ</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Azienda</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><a href="/about" className="hover:text-background transition">Chi Siamo</a></li>
              <li><a href="/contact" className="hover:text-background transition">Contatti</a></li>
              <li><a href="/blog" className="hover:text-background transition">Blog</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Legale</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><a href="/privacy" className="hover:text-background transition">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-background transition">Termini di Servizio</a></li>
              <li><a href="/disclaimer" className="hover:text-background transition">Disclaimer</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-background/20 pt-8 text-center text-sm text-background/60">
          <p>&copy; 2024 Difendimi.AI. Tutti i diritti riservati.</p>
        </div>
      </div>
    </footer>
    
    {/* Install PWA Component */}
    <InstallPWA />

    {/* Preview Modal */}
    <Dialog open={showPreview} onOpenChange={setShowPreview}>
      <DialogContent className="max-w-7xl h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-card">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Esempio di Analisi - Multa per divieto di sosta</DialogTitle>
            <Badge variant="secondary">DEMO</Badge>
          </div>
        </DialogHeader>
        <div className="overflow-y-auto h-[calc(90vh-80px)]">
          <ReportSections report={DEMO_CASE_DATA} />
        </div>
      </DialogContent>
    </Dialog>

    {/* Install Instructions Sheet */}
    <Sheet open={showInstallSheet} onOpenChange={setShowInstallSheet}>
      <SheetContent>
        <div className="space-y-6 mt-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Come installare Difendimi</h3>
            {isIOS ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Per dispositivi iOS:</p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Apri questa pagina in Safari</li>
                  <li>Tocca il pulsante Condividi <span className="inline-block">⬆️</span></li>
                  <li>Scorri e tocca "Aggiungi a Home"</li>
                  <li>Tocca "Aggiungi" in alto a destra</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Per installare l'app:</p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Apri questa pagina in Chrome o Edge</li>
                  <li>Cerca l'icona di installazione nella barra degli indirizzi</li>
                  <li>Clicca su "Installa Difendimi"</li>
                  <li>Segui le istruzioni del browser</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  </div>
  );
};

export default Index;