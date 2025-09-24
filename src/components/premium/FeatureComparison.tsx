import { Check, Lock } from "lucide-react";

interface Feature {
  name: string;
  free: boolean;
  premium: boolean;
}

const features: Feature[] = [
  { name: "Analisi preliminare del caso", free: true, premium: true },
  { name: "Valutazione giuridica base", free: true, premium: true },
  { name: "Generazione dossier completo", free: false, premium: true },
  { name: "Documenti personalizzati", free: false, premium: true },
  { name: "Opzioni procedurali dettagliate", free: false, premium: true },
  { name: "Timeline e scadenze complete", free: false, premium: true },
  { name: "Stima costi procedura", free: false, premium: true },
  { name: "Documenti da allegare", free: false, premium: true },
  { name: "Export PDF illimitati", free: false, premium: true },
  { name: "Supporto prioritario", free: false, premium: true },
];

export function FeatureComparison() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-4 text-sm font-medium border-b pb-2">
        <div></div>
        <div className="text-center text-muted-foreground">Free</div>
        <div className="text-center bg-gradient-to-r from-yellow-500 to-yellow-600 text-transparent bg-clip-text">
          Premium
        </div>
      </div>
      
      {features.map((feature, index) => (
        <div 
          key={index} 
          className="grid grid-cols-3 gap-4 text-sm py-2 hover:bg-muted/50 rounded-lg px-2 transition-colors"
        >
          <div className="text-foreground">{feature.name}</div>
          <div className="flex justify-center">
            {feature.free ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <Lock className="h-5 w-5 text-muted-foreground/50" />
            )}
          </div>
          <div className="flex justify-center">
            <Check className="h-5 w-5 text-green-500" />
          </div>
        </div>
      ))}
    </div>
  );
}