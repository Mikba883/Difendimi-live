import { ReactNode } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface BlurredContentProps {
  children: ReactNode;
  isPremium: boolean;
  className?: string;
  label?: string;
}

export function BlurredContent({ 
  children, 
  isPremium, 
  className = "",
  label = "Contenuto Premium"
}: BlurredContentProps) {
  const navigate = useNavigate();

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div 
      className={cn(
        "relative cursor-pointer group",
        className
      )}
      onClick={() => navigate("/premium")}
    >
        {/* Blurred content */}
        <div className="blur-md pointer-events-none select-none">
          {children}
        </div>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center transition-all group-hover:bg-background/60">
          <div className="text-center space-y-2 p-4 bg-background/90 rounded-lg border shadow-lg">
            <Lock className="h-8 w-8 text-yellow-500 mx-auto" />
            <p className="font-semibold text-foreground">{label}</p>
            <p className="text-sm text-muted-foreground">
              Clicca per sbloccare con Premium
            </p>
          </div>
        </div>
    </div>
  );
}