import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function PrivacyBadgeEnhanced() {
  return (
    <div className="relative">
      {/* Effetto sfumato di background che parte dal basso e si dirada */}
      <div className="absolute inset-0 -top-20 bg-gradient-to-b from-primary/5 via-primary/3 to-transparent pointer-events-none" />
      
      {/* Badge con contenuto più grande */}
      <div className="relative flex items-center justify-center gap-2 py-6">
        <Badge variant="outline" className="flex items-center gap-3 px-6 py-4 text-sm border-primary/20 bg-background/80 backdrop-blur-sm shadow-lg">
          <Shield className="h-6 w-6 text-primary flex-shrink-0" />
          <div className="flex flex-col items-start gap-1">
            <span className="font-semibold text-base">La tua privacy è garantita</span>
            <span className="font-normal text-muted-foreground text-sm">
              Il processo è totalmente anonimo. Nessuna informazione viene salvata nei nostri server.
            </span>
          </div>
        </Badge>
      </div>
    </div>
  );
}
