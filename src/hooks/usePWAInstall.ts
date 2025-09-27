import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export const usePWAInstall = () => {
  const navigate = useNavigate();
  
  const handleInstall = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent) && !/crios/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isMobile = isIOS || isAndroid;
    
    if (!isMobile) {
      // Desktop - redirect to login
      navigate('/login');
    } else if (isIOS) {
      // iOS - show Safari instructions
      toast({
        title: "Installa Difendimi.AI",
        description: "Tocca il pulsante Condividi in Safari e poi 'Aggiungi a Home'",
        duration: 5000,
      });
    } else if (isAndroid) {
      // Android - show Chrome instructions
      toast({
        title: "Installa Difendimi.AI", 
        description: "Tocca il menu (⋮) del browser e poi 'Installa app' o 'Aggiungi a schermata Home'",
        duration: 5000,
      });
    }
  };
  
  return {
    handleInstall
  };
};