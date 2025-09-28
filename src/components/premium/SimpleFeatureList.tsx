import { Check, X } from "lucide-react";

interface Feature {
  name: string;
  included: boolean;
}

const features: Feature[] = [
  { name: "Generazione dossier completo", included: true },
  { name: "Documenti personalizzati", included: true },
  { name: "Opzioni procedurali dettagliate", included: true },
  { name: "Timeline e scadenze complete", included: true },
  { name: "Stima costi procedura", included: true },
  { name: "Documenti da allegare", included: true },
  { name: "Export PDF illimitati", included: true },
  { name: "Supporto prioritario", included: true },
  { name: "Analisi base (solo Free)", included: false },
];

export function SimpleFeatureList() {
  return (
    <ul className="space-y-3">
      {features.map((feature, index) => (
        <li 
          key={index}
          className="flex items-start gap-3 text-sm"
        >
          {feature.included ? (
            <>
              <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-foreground">{feature.name}</span>
            </>
          ) : (
            <>
              <X className="h-5 w-5 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
              <span className="text-muted-foreground line-through">{feature.name}</span>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}