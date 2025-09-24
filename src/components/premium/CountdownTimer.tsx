import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  timeRemaining: string;
  className?: string;
}

export function CountdownTimer({ timeRemaining, className = "" }: CountdownTimerProps) {
  const [urgency, setUrgency] = useState<"low" | "medium" | "high">("low");

  useEffect(() => {
    const [hours] = timeRemaining.split(":").map(Number);
    
    if (hours <= 1) {
      setUrgency("high");
    } else if (hours <= 6) {
      setUrgency("medium");
    } else {
      setUrgency("low");
    }
  }, [timeRemaining]);

  const urgencyColors = {
    low: "text-primary",
    medium: "text-yellow-500",
    high: "text-red-500 animate-pulse",
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Clock className={`h-5 w-5 ${urgencyColors[urgency]}`} />
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Offerta valida solo per i prossimi</p>
        <p className={`text-2xl font-bold font-mono ${urgencyColors[urgency]}`}>
          {timeRemaining}
        </p>
      </div>
    </div>
  );
}