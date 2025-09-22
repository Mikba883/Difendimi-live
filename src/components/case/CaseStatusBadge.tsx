import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CaseStatus } from "@/types/case";

interface CaseStatusBadgeProps {
  status: CaseStatus;
  className?: string;
}

export function CaseStatusBadge({ status, className }: CaseStatusBadgeProps) {
  const statusConfig = {
    draft: { label: "Bozza", variant: "secondary" as const },
    collecting: { label: "Raccolta Info", variant: "default" as const },
    queued: { label: "In Coda", variant: "outline" as const },
    processing: { label: "In Elaborazione", variant: "default" as const },
    ready: { label: "Pronto", variant: "default" as const },
    error: { label: "Errore", variant: "destructive" as const },
    archived: { label: "Archiviato", variant: "secondary" as const },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <Badge 
      variant={config.variant}
      className={cn(
        status === 'ready' && "bg-green-500/10 text-green-700 border-green-200",
        status === 'processing' && "bg-blue-500/10 text-blue-700 border-blue-200",
        className
      )}
    >
      {config.label}
    </Badge>
  );
}