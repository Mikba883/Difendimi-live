import { usePWA } from '@/contexts/PWAContext';

export const usePWAInstall = () => {
  const { triggerInstall } = usePWA();
  
  return {
    handleInstall: triggerInstall
  };
};