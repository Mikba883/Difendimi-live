import { usePWA } from '@/contexts/PWAContext';

export const usePWAInstall = () => {
  const { triggerInstall } = usePWA();
  
  return {
    handleInstall: () => {
      // Always trigger install - context will handle logic
      triggerInstall();
    }
  };
};