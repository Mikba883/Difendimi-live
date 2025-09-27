import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAContextType {
  isInstalled: boolean;
  isInstallable: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  showInstallBanner: boolean;
  dismissBanner: () => void;
  installApp: () => Promise<void>;
  triggerInstall: () => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};

export const PWAProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  const dismissBanner = () => {
    setShowInstallBanner(false);
    if (isIOS) {
      localStorage.setItem('pwa-banner-dismissed-ios', Date.now().toString());
    } else {
      localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
    }
  };

  const installApp = async () => {
    console.log('Install app called', { installPrompt, isIOS, isAndroid });

    if (isIOS) {
      alert('Per installare l\'app su iOS:\n\n1. Tocca il pulsante Condividi ⬆️\n2. Scorri e tocca "Aggiungi a Home"\n3. Tocca "Aggiungi"');
      dismissBanner();
      return;
    }

    if (isAndroid && !installPrompt) {
      alert('Per installare l\'app su Android:\n\n1. Tocca il menu ⋮ del browser\n2. Seleziona "Installa app" o "Aggiungi a schermata Home"');
      dismissBanner();
      return;
    }

    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        console.log('User choice:', outcome);
        
        if (outcome === 'accepted') {
          setInstallPrompt(null);
          setShowInstallBanner(false);
        }
      } catch (error) {
        console.error('Error showing install prompt:', error);
        navigate('/login');
      }
    } else {
      console.log('No install method available, redirecting to login');
      navigate('/login');
    }
  };

  const triggerInstall = () => {
    console.log('Trigger install called', { isInstallable, isInstalled });
    
    if (isInstalled) {
      console.log('App already installed');
      return;
    }

    if (isInstallable || isIOS || isAndroid) {
      installApp();
    } else {
      navigate('/login');
    }
  };

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    const isAndroidDevice = /android/.test(userAgent);
    const isMobileDevice = /mobile|android|iphone|ipad|ipod/.test(userAgent);
    
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsMobile(isMobileDevice);

    console.log('PWA Context initialized:', {
      isIOS: isIOSDevice,
      isAndroid: isAndroidDevice,
      isMobile: isMobileDevice,
      userAgent
    });

    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone === true ||
                          document.referrer.includes('android-app://');
      
      setIsInstalled(isStandalone);
      console.log('PWA installed status:', isStandalone);
      
      return isStandalone;
    };

    checkInstalled();

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setInstallPrompt(promptEvent);
      setIsInstallable(true);
      
      if (!checkInstalled()) {
        setTimeout(() => {
          const lastDismissed = localStorage.getItem('pwa-banner-dismissed');
          if (!lastDismissed || Date.now() - parseInt(lastDismissed) > 7 * 24 * 60 * 60 * 1000) {
            setShowInstallBanner(true);
          }
        }, 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (isIOSDevice && !checkInstalled()) {
      setIsInstallable(true);
      setTimeout(() => {
        const lastDismissed = localStorage.getItem('pwa-banner-dismissed-ios');
        if (!lastDismissed || Date.now() - parseInt(lastDismissed) > 7 * 24 * 60 * 60 * 1000) {
          setShowInstallBanner(true);
        }
      }, 3000);
    }

    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setIsInstalled(true);
      setShowInstallBanner(false);
      setInstallPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    const displayModeQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      console.log('Display mode changed:', e.matches);
      setIsInstalled(e.matches);
    };
    
    displayModeQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      displayModeQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  // Listen for custom trigger events
  useEffect(() => {
    const handleTriggerEvent = () => {
      console.log('Custom PWA install trigger received');
      triggerInstall();
    };
    
    window.addEventListener('trigger-pwa-install', handleTriggerEvent);
    
    return () => {
      window.removeEventListener('trigger-pwa-install', handleTriggerEvent);
    };
  }, [triggerInstall]);

  return (
    <PWAContext.Provider value={{
      isInstalled,
      isInstallable,
      isIOS,
      isAndroid,
      isMobile,
      installPrompt,
      showInstallBanner,
      dismissBanner,
      installApp,
      triggerInstall
    }}>
      {children}
    </PWAContext.Provider>
  );
};