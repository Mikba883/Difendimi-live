import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
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
        {/* Header with back button and timer */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          {/* Timer Section */}
          <CountdownTimer timeRemaining={timeRemaining} className="justify-center" />
        </div>

        <div className="bg-card rounded-xl shadow-lg overflow-hidden">

          {/* Content */}
          <div className="relative p-8">
            {/* Diagonal Badge */}
            <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden">
              <div className="absolute transform rotate-45 bg-green-500 text-white text-center font-bold py-1 right-[-30px] top-[12px] w-[120px] shadow-lg text-sm">
                Promo -68%
              </div>
            </div>

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
                <span className="text-5xl font-bold text-violet-600">4,13€</span>
                <span className="text-muted-foreground">/mese</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-base">Pagamento unico</span>
                <span className="text-base font-semibold">49,50€</span>
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
              {/* Discount Applied Badge */}
              <div className="flex justify-center">
                <Badge variant="secondary" className="gap-2">
                  <CheckCircle2 className="h-3 w-3" />
                  Sconto 68% applicato
                </Badge>
              </div>
              
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