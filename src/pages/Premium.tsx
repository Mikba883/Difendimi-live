import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { CountdownTimer } from "@/components/premium/CountdownTimer";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Premium() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { timeRemaining } = usePremiumStatus();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpgrade = async () => {
    setIsProcessing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Errore",
          description: "Devi essere loggato per effettuare l'upgrade",
          variant: "destructive",
        });
        navigate("/login");
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

  const features = [
    { name: "Analisi personalizzata del tuo caso", bold: false },
    { name: "Accesso alla scheda generale", bold: false },
    { name: "Principali riferimenti normativi", bold: false },
    { name: "Generazione del dossier completo", bold: true },
    { name: "Documenti personalizzati", bold: true },
    { name: "Opzioni procedurali dettagliate", bold: true },
    { name: "Accesso a statistiche di tempi e costi", bold: true },
    { name: "Export PDF illimitati", bold: true },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna al caso
        </Button>

        <div className="bg-card rounded-xl shadow-lg overflow-hidden">
          {/* Timer Section */}
          <div className="bg-muted/50 p-4 border-b">
            <CountdownTimer timeRemaining={timeRemaining} className="justify-center" />
          </div>

          {/* Content */}
          <div className="relative p-8">
            {/* Badge */}
            <Badge className="absolute top-4 right-4 bg-green-500 text-white border-0 px-3 py-1 text-lg font-bold">
              -68%
            </Badge>

            {/* Header */}
            <div className="text-center mb-8 mt-4">
              <h1 className="text-3xl font-bold mb-3">
                Difendimi.AI Premium
              </h1>
              <p className="text-muted-foreground">
                Sblocca tutte le funzionalità avanzate per sapere sempre cosa dice la legge
              </p>
            </div>

            {/* Pricing */}
            <div className="text-center mb-8">
              <div className="flex items-baseline justify-center gap-2 mb-2">
                <span className="text-5xl font-bold text-primary">4,13€</span>
                <span className="text-muted-foreground">/mese</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                fatturati 49,50€ all'anno
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-base font-semibold">Pagamento unico 49,50€</span>
                <span className="text-base text-muted-foreground line-through">154€</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mb-8">
              <Button 
                size="lg" 
                className="w-full bg-red-500 hover:bg-red-600 text-white text-lg py-6"
                onClick={handleUpgrade}
                disabled={isProcessing}
              >
                {isProcessing ? "Elaborazione..." : "Accedi ora"}
              </Button>
            </div>

            {/* Features */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Include:</h3>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li 
                    key={index}
                    className="flex items-start gap-3"
                  >
                    <svg
                      className={`flex-shrink-0 mt-0.5 ${
                        feature.bold ? 'w-6 h-6' : 'w-5 h-5'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={feature.bold ? 3 : 2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                        className="text-green-500"
                      />
                    </svg>
                    <span className={`text-sm ${feature.bold ? 'font-bold' : ''}`}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer */}
            <div className="text-center space-y-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                onClick={() => navigate(-1)}
              >
                Continua con il piano gratuito
              </Button>
              
              <p className="text-[10px] text-muted-foreground">
                Puoi cancellare in qualsiasi momento. Nessun vincolo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}