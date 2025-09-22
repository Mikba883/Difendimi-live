import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AudioWaveform } from "./AudioWaveform";
import { Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceRecordingInputProps {
  isRecording: boolean;
  isProcessing?: boolean;
  onStopRecording: () => void;
  audioContext?: AudioContext;
  mediaStream?: MediaStream;
  className?: string;
}

export function VoiceRecordingInput({
  isRecording,
  isProcessing = false,
  onStopRecording,
  audioContext,
  mediaStream,
  className
}: VoiceRecordingInputProps) {
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    if (!isRecording) {
      setRecordingTime(0);
      return;
    }

    const interval = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn(
      "flex items-center justify-between gap-4 bg-card/50 backdrop-blur-sm rounded-2xl p-4 border border-border shadow-md animate-in fade-in slide-in-from-bottom-2 duration-300",
      className
    )}>
      <div className="flex-1 flex flex-col items-center gap-3">
        {isProcessing ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Trascrizione in corso...</span>
          </div>
        ) : (
          <>
            <AudioWaveform
              isRecording={isRecording}
              audioContext={audioContext}
              mediaStream={mediaStream}
              className="w-full"
            />
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">
                Registrazione in corso
              </span>
              <span className="text-sm font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
                {formatTime(recordingTime)}
              </span>
            </div>
          </>
        )}
      </div>
      
      <Button
        type="button"
        size="icon"
        variant="destructive"
        onClick={onStopRecording}
        disabled={isProcessing}
        className={cn(
          "h-12 w-12 rounded-full transition-all",
          "hover:scale-105 active:scale-95",
          isProcessing && "opacity-50 cursor-not-allowed"
        )}
      >
        <Square className="h-5 w-5" />
      </Button>
    </div>
  );
}