import { Shield, ArrowRight, CheckCircle, Lock, Scale, Clock, Download, Brain, FileText, Zap, Users, Star, MessageSquare, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InstallPWA } from "@/components/InstallPWA";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="fixed top-0 w-full bg-background/95 backdrop-blur-md border-b border-border/50 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Difendimi.AI
              </h1>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleMainButtonClick}
                variant="outline"
                className="hover:bg-primary/10"
              >
                <Download className="h-4 w-4 mr-2" />
                Scarica l'app
              </Button>
              <Button 
                onClick={() => navigate("/login")}
                className="bg-gradient-primary hover:opacity-90 transition-opacity text-white shadow-elegant"
              >
                Accedi
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-rose-400 to-purple-500 opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Assistenza Legale Intelligente</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in">
              Fai valere i tuoi
              <span className="bg-gradient-primary bg-clip-text text-transparent"> diritti</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 animate-fade-in" style={{animationDelay: "0.1s"}}>
              Senza attese, senza parcelle, con l'intelligenza artificiale
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{animationDelay: "0.2s"}}>
              <Button 
                size="lg"
                onClick={() => navigate("/case/new")}
                className="bg-gradient-primary hover:opacity-90 text-white shadow-elegant px-8"
              >
                Analizza subito il tuo caso
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-8 mt-12 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>100% Anonimo</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>Privacy Garantita</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <span>AI Avanzata</span>
              </div>
            </div>
          </div>
        </div>
      </section>

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
    </div>
  );
};

export default Index;