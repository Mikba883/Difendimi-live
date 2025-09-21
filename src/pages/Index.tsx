import { Shield, ArrowRight, CheckCircle, Lock, Scale, Clock, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { InstallPWA } from "@/components/InstallPWA";
import { useState, useEffect } from "react";

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
  }, []);

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
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="text-center max-w-4xl mx-auto animate-fadeIn">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl bg-gradient-primary shadow-glow animate-pulse-glow">
              <Shield className="h-16 w-16 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Difendimi.AI
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Scopri cosa dice la legge, senza attese né parcelle
          </p>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Un assistente intelligente che analizza il tuo caso legale, cerca le normative pertinenti
            e ti fornisce informazioni educative chiare e comprensibili.
          </p>
          <Button 
            size="lg" 
            onClick={handleMainButtonClick}
            className="gap-2"
          >
            {isInstalled ? (
              <>
                Apri App
                <ArrowRight className="h-5 w-5" />
              </>
            ) : installPrompt ? (
              <>
                <Download className="h-5 w-5" />
                Installa App
              </>
            ) : (
              <>
                Apri App (PWA)
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Come Funziona Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Come Funziona</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="border-none shadow-lg">
            <CardContent className="pt-6">
              <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-primary font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Racconta il tuo caso</h3>
              <p className="text-muted-foreground">
                Descrivi la tua situazione scrivendo o parlando. L'AI ti guiderà con domande mirate.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="pt-6">
              <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-primary font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Fonti ufficiali</h3>
              <p className="text-muted-foreground">
                Il sistema cerca automaticamente le normative italiane ed europee pertinenti.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="pt-6">
              <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-primary font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Ricevi le informazioni</h3>
              <p className="text-muted-foreground">
                Ottieni 7 schede informative e documenti PDF scaricabili.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Benefici Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">I Vantaggi</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold mb-1">100% Anonimo</h4>
              <p className="text-sm text-muted-foreground">I tuoi dati sono sempre protetti e anonimizzati</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Scale className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold mb-1">Fonti Ufficiali</h4>
              <p className="text-sm text-muted-foreground">Basato su Normattiva e EUR-Lex</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold mb-1">Risposte Immediate</h4>
              <p className="text-sm text-muted-foreground">Ottieni informazioni in pochi minuti</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Lock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold mb-1">Privacy First</h4>
              <p className="text-sm text-muted-foreground">Nessun dato personale viene salvato</p>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer Section */}
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-3xl mx-auto bg-muted/50">
          <CardContent className="p-8">
            <h3 className="text-xl font-semibold mb-4">Nota Importante</h3>
            <p className="text-muted-foreground">
              Difendimi.AI fornisce esclusivamente informazioni educative e non costituisce consulenza legale.
              Per questioni legali specifiche, consulta sempre un avvocato qualificato.
              Il servizio è progettato per aiutarti a comprendere meglio le normative applicabili al tuo caso.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold">Difendimi.AI</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="/privacy" className="hover:text-foreground transition">Privacy Policy</a>
              <a href="/terms" className="hover:text-foreground transition">Termini & Condizioni</a>
              <a href="/disclaimer" className="hover:text-foreground transition">Disclaimer Legale</a>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Install PWA Component */}
      <InstallPWA />
    </div>
  );
};

export default Index;