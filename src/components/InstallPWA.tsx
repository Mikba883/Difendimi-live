import React from 'react';
import { X, Download } from 'lucide-react';
import { usePWA } from '@/contexts/PWAContext';
import { Button } from '@/components/ui/button';

const InstallPWA: React.FC = () => {
  const { 
    isInstalled, 
    showInstallBanner, 
    dismissBanner, 
    installApp 
  } = usePWA();

  // Don't show anything if already installed
  if (isInstalled) {
    return null;
  }

  // Don't show if banner is not active
  if (!showInstallBanner) {
    return null;
  }

  // Single banner for all platforms - no instructions
  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-card border border-border rounded-lg shadow-lg p-3 relative">
        <button
          onClick={dismissBanner}
          className="absolute right-2 top-2 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Chiudi"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="flex items-center gap-3 pr-6">
          <div className="bg-primary/10 p-2 rounded-lg shrink-0">
            <Download className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">Installa App</h3>
            <p className="text-xs text-muted-foreground line-clamp-1">
              Accesso rapido dalla home
            </p>
          </div>
          <Button
            onClick={installApp}
            size="sm"
            className="shrink-0"
          >
            Installa
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;

export { InstallPWA };