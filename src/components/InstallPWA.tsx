import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPWA = () => {
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
      console.log('App già installata come PWA');
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log('beforeinstallprompt event fired');
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app was installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA installata con successo');
      setIsInstalled(true);
      setInstallPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      console.log('Install prompt not available');
      return;
    }

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      console.log(`User choice: ${outcome}`);
      
      if (outcome === 'accepted') {
        setInstallPrompt(null);
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
    }
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  // iOS specific instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto bg-card border rounded-lg shadow-lg p-4 z-50 animate-fadeIn">
        <p className="text-sm mb-2">Installa l'app sul tuo iPhone:</p>
        <ol className="text-xs text-muted-foreground space-y-1">
          <li>1. Tocca il pulsante Condividi <span className="inline-block">⬆️</span></li>
          <li>2. Scorri e tocca "Aggiungi a Home"</li>
          <li>3. Tocca "Aggiungi" in alto a destra</li>
        </ol>
      </div>
    );
  }

  // Show install button only when prompt is available
  if (installPrompt) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-fadeIn">
        <Button 
          onClick={handleInstallClick}
          className="shadow-lg gap-2"
          size="lg"
        >
          <Download className="h-4 w-4" />
          Installa App
        </Button>
      </div>
    );
  }

  return null;
};