import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function PrivacyBadge() {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <Badge variant="outline" className="flex items-center gap-2 px-4 py-2 text-xs">
        <Shield className="h-4 w-4 text-primary" />
        <div className="flex flex-col items-start">
          <span className="font-semibold">La tua privacy è garantita</span>
          <span className="font-normal text-muted-foreground">
            Il processo è totalmente anonimo. Nessuna informazione viene salvata nei nostri server.
          </span>
        </div>
      </Badge>
    </div>
  );
}
