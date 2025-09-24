import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { SimpleFeatureList } from "./SimpleFeatureList";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PremiumPaywallProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PremiumPaywall({ open, onOpenChange }: PremiumPaywallProps) {
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
      <DialogContent className="max-w-md w-[95vw] max-h-[90vh] overflow-y-auto p-0">
        {/* Header con Badge Promo */}
        <div className="relative p-6 pb-4">
          <Badge className="absolute top-4 right-4 bg-green-500 text-white border-0 px-3 py-1">
            Promo -50%
          </Badge>
          
          <DialogHeader className="mt-2">
            <DialogTitle className="text-2xl font-bold text-center">
              LegalAI Premium
            </DialogTitle>
            <p className="text-sm text-center text-muted-foreground mt-2">
              Sblocca tutte le funzionalità avanzate per i tuoi casi legali
            </p>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 space-y-6">
          {/* Pricing Section */}
          <div className="text-center space-y-1">
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-4xl font-bold">4,13€</span>
              <span className="text-muted-foreground text-sm">/mese</span>
            </div>
            <p className="text-xs text-muted-foreground">
              fatturati 49,50€ all'anno
            </p>
            <p className="text-xs text-green-600 font-medium">
              Risparmi il 50% rispetto al piano mensile
            </p>
          </div>

          {/* Features List */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Cosa include Premium:</h3>
            <SimpleFeatureList />
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Button 
              size="lg" 
              className="w-full bg-red-500 hover:bg-red-600 text-white"
              onClick={handleUpgrade}
              disabled={isProcessing}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isProcessing ? "Elaborazione..." : "Abbonati ora"}
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs"
              onClick={() => onOpenChange(false)}
            >
              Continua con il piano gratuito
            </Button>
          </div>

          <p className="text-[10px] text-center text-muted-foreground">
            Puoi cancellare in qualsiasi momento. Nessun vincolo.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}