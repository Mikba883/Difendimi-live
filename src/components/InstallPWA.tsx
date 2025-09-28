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
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 relative">
        <button
          onClick={dismissBanner}
          className="absolute right-2 top-2 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Chiudi"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="flex items-start gap-3 pr-6">
          <div className="bg-primary/10 p-2 rounded-lg shrink-0">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Installa Difendimi.AI</h3>
            <p className="text-xs text-muted-foreground">
              Accedi rapidamente all'app dalla tua home screen
            </p>
            <Button
              onClick={installApp}
              size="sm"
              className="w-full mt-2"
            >
              Installa App
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;

export { InstallPWA };