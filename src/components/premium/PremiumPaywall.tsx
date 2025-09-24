import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Sparkles, Timer, TrendingDown } from "lucide-react";
import { CountdownTimer } from "./CountdownTimer";
import { FeatureComparison } from "./FeatureComparison";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PremiumPaywallProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PremiumPaywall({ open, onOpenChange }: PremiumPaywallProps) {
  const { timeRemaining } = usePremiumStatus();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpgrade = async () => {
    setIsProcessing(true);
    
    try {
      // Qui andrà l'integrazione con Stripe
      // Per ora simuliamo un upgrade
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Errore",
          description: "Devi essere loggato per effettuare l'upgrade",
          variant: "destructive",
        });
        return;
      }

      // Placeholder per integrazione Stripe futura
      toast({
        title: "Coming Soon",
        description: "L'integrazione con i pagamenti sarà disponibile a breve!",
      });
      
    } catch (error) {
      console.error("Error upgrading to premium:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'upgrade",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 p-6">
          <DialogHeader>
            <div className="flex items-center justify-between mb-4">
              <Badge className="bg-red-500 text-white border-0 animate-pulse">
                <Timer className="h-3 w-3 mr-1" />
                Offerta Limitata
              </Badge>
              <CountdownTimer timeRemaining={timeRemaining} />
            </div>
            
            <DialogTitle className="text-3xl font-bold flex items-center gap-2">
              <Crown className="h-8 w-8 text-yellow-500" />
              Sblocca l'Accesso Premium
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-lg text-muted-foreground">
              Accedi a tutte le funzionalità avanzate per gestire i tuoi casi legali
            </p>
            
            {/* Pricing */}
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-6 my-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Badge className="bg-green-500 text-white">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Risparmia il 68%
                </Badge>
              </div>
              
              <div className="flex items-end justify-center gap-2">
                <span className="text-4xl font-bold text-primary">4,13€</span>
                <span className="text-muted-foreground">/mese</span>
              </div>
              
              <p className="text-sm text-muted-foreground mt-2">
                Pagamento annuale di 49,50€ invece di <span className="line-through">154,50€</span>
              </p>
            </div>
          </div>

          {/* Features Comparison */}
          <FeatureComparison />

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Button 
              size="lg" 
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
              onClick={handleUpgrade}
              disabled={isProcessing}
            >
              <Sparkles className="h-5 w-5 mr-2" />
              {isProcessing ? "Elaborazione..." : "Diventa Premium Ora"}
            </Button>
            
            <Button 
              variant="ghost" 
              size="lg" 
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              Continua con il piano Free
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Cancellazione disponibile in qualsiasi momento. Nessun vincolo.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}