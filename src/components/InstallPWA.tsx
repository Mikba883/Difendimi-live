import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Smartphone, Monitor } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPWA = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = localStorage.getItem('pwa-install-dismissed-time');
    
    if (dismissed && dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setIsDismissed(true);
      } else {
        // Reset after 7 days
        localStorage.removeItem('pwa-install-dismissed');
        localStorage.removeItem('pwa-install-dismissed-time');
      }
    }

    // Listen for custom trigger event from other components
    const handleTriggerInstall = () => {
      if (installPrompt) {
        handleInstallClick();
      } else if (isIOS) {
        setShowBanner(true);
        setIsDismissed(false);
      } else {
        // If no PWA available, redirect to login
        window.location.href = '/login';
      }
    };

    window.addEventListener('trigger-pwa-install', handleTriggerInstall);

    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !('MSStream' in window);
    const isAndroidDevice = /android/.test(userAgent);
    const isMobileDevice = /mobile|tablet|android|ipad|iphone/.test(userAgent);
    
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsMobile(isMobileDevice);

    // Check if already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebApp = (window.navigator as any).standalone === true;
      const installed = isStandalone || isInWebApp;
      
      setIsInstalled(installed);
      
      if (installed) {
        console.log('PWA già installata');
        localStorage.setItem('pwa-installed', 'true');
      }
    };

    checkInstalled();

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log('beforeinstallprompt catturato');
      const promptEvent = e as BeforeInstallPromptEvent;
      setInstallPrompt(promptEvent);
      
      // Mark PWA as available
      localStorage.setItem('pwa-available', 'true');
      
      // Show banner after a delay if not dismissed
      if (!isDismissed && !localStorage.getItem('pwa-installed')) {
        setTimeout(() => setShowBanner(true), 2000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Mark iOS as PWA available too
    if (isIOS && !isInstalled) {
      localStorage.setItem('pwa-available', 'true');
    }

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      console.log('PWA installata con successo');
      setIsInstalled(true);
      setInstallPrompt(null);
      setShowBanner(false);
      localStorage.setItem('pwa-installed', 'true');
    });

    // Check display mode changes
    const displayModeQuery = window.matchMedia('(display-mode: standalone)');
    displayModeQuery.addEventListener('change', checkInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('trigger-pwa-install', handleTriggerInstall);
      displayModeQuery.removeEventListener('change', checkInstalled);
    };
  }, [isDismissed]);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      console.log('Prompt di installazione non disponibile');
      
      // Instead of showing instructions, redirect to login
      window.location.href = '/login';
      return;
    }

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      console.log(`Scelta utente: ${outcome}`);
      
      if (outcome === 'accepted') {
        setInstallPrompt(null);
        setShowBanner(false);
        localStorage.setItem('pwa-installed', 'true');
      }
    } catch (error) {
      console.error('Errore durante l\'installazione:', error);
      // If error, redirect to login
      window.location.href = '/login';
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
    localStorage.setItem('pwa-install-dismissed-time', Date.now().toString());
  };

  // Don't show anything if installed
  if (isInstalled) {
    return null;
  }

  // iOS specific banner
  if (isIOS && showBanner && !isDismissed) {
    return (
      <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-card border-2 shadow-xl p-4 z-50 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm mb-1">Installa Difendimi.AI</p>
              <p className="text-xs text-muted-foreground mb-2">
                Accedi rapidamente all'app dalla tua Home
              </p>
              <ol className="text-xs text-muted-foreground space-y-1">
                <li>1. Tocca <span className="font-semibold">Condividi ⬆️</span></li>
                <li>2. Scorri e tocca <span className="font-semibold">"Aggiungi a Home"</span></li>
                <li>3. Tocca <span className="font-semibold">"Aggiungi"</span></li>
              </ol>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 -mr-2 -mt-2"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }

  // Android/Desktop install banner
  if ((installPrompt || isAndroid) && showBanner && !isDismissed) {
    return (
      <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-card border-2 shadow-xl p-4 z-50 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              {isMobile ? <Smartphone className="h-5 w-5 text-primary" /> : <Monitor className="h-5 w-5 text-primary" />}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm mb-1">Installa Difendimi.AI</p>
              <p className="text-xs text-muted-foreground mb-3">
                {isMobile 
                  ? "Accedi rapidamente all'app dal tuo telefono"
                  : "Installa l'app per un accesso rapido dal desktop"}
              </p>
              <Button 
                onClick={handleInstallClick}
                size="sm"
                className="w-full gap-2"
              >
                <Download className="h-3 w-3" />
                Installa ora
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 -mr-2 -mt-2"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }

  // Floating install button (always visible if not installed and not dismissed for too long)
  const daysSinceDismissed = isDismissed 
    ? (Date.now() - parseInt(localStorage.getItem('pwa-install-dismissed-time') || '0')) / (1000 * 60 * 60 * 24)
    : 0;

  if (!showBanner && (installPrompt || isIOS || isAndroid) && (!isDismissed || daysSinceDismissed > 1)) {
    return (
      <Button
        onClick={() => {
          if (installPrompt || isAndroid) {
            handleInstallClick();
          } else if (isIOS) {
            setShowBanner(true);
            setIsDismissed(false);
          }
        }}
        className="fixed bottom-4 right-4 z-40 shadow-lg gap-2 animate-in fade-in duration-500"
        size="lg"
      >
        <Download className="h-4 w-4" />
        Installa App
      </Button>
    );
  }

  return null;
};