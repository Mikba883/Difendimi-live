import { useEffect, useState } from "react";

interface CountdownTimerProps {
  timeRemaining: string;
  className?: string;
}

export function CountdownTimer({ timeRemaining, className = "" }: CountdownTimerProps) {
  const [days, setDays] = useState("00");
  const [hours, setHours] = useState("00");
  const [minutes, setMinutes] = useState("00");
  const [seconds, setSeconds] = useState("00");

  useEffect(() => {
    // Parse time from HH:MM:SS format
    const parts = timeRemaining.split(":");
    if (parts.length === 3) {
      const totalHours = parseInt(parts[0]);
      const mins = parts[1];
      const secs = parts[2];
      
      // Calculate days from hours
      const calculatedDays = Math.floor(totalHours / 24);
      const remainingHours = totalHours % 24;
      
      setDays(calculatedDays.toString().padStart(2, "0"));
      setHours(remainingHours.toString().padStart(2, "0"));
      setMinutes(mins);
      setSeconds(secs);
    }
  }, [timeRemaining]);

  const TimeBox = ({ value, label }: { value: string; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-pink-100 rounded-lg p-3 min-w-[60px]">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      </div>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  );

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <p className="text-sm text-muted-foreground">Offerta valida solo per</p>
      <div className="flex items-center gap-2">
        <TimeBox value={days} label="Giorni" />
        <span className="text-2xl font-bold text-muted-foreground">:</span>
        <TimeBox value={hours} label="Ore" />
        <span className="text-2xl font-bold text-muted-foreground">:</span>
        <TimeBox value={minutes} label="Minuti" />
        <span className="text-2xl font-bold text-muted-foreground">:</span>
        <TimeBox value={seconds} label="Secondi" />
      </div>
    </div>
  );
}