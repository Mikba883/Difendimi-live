import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AudioWaveformProps {
  isRecording: boolean;
  audioContext?: AudioContext;
  mediaStream?: MediaStream;
  className?: string;
}

export function AudioWaveform({ 
  isRecording, 
  audioContext, 
  mediaStream,
  className 
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode>();
  const [bars] = useState(40);

  useEffect(() => {
    if (!isRecording || !audioContext || !mediaStream || !canvasRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up audio analyzer
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(mediaStream);
    source.connect(analyser);
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / bars;
      const gap = 2;

      for (let i = 0; i < bars; i++) {
        const dataIndex = Math.floor((i / bars) * bufferLength);
        const value = dataArray[dataIndex];
        const normalizedValue = value / 255;
        
        // Calculate bar height with minimum height for visual appeal
        const minHeight = 4;
        const maxHeight = canvas.height * 0.8;
        const barHeight = Math.max(minHeight, normalizedValue * maxHeight);
        
        const x = i * barWidth + gap / 2;
        const y = (canvas.height - barHeight) / 2;

        // Create gradient for bars
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, 'hsl(var(--primary) / 0.6)');
        gradient.addColorStop(1, 'hsl(var(--primary))');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth - gap, barHeight);
        
        // Add rounded corners effect
        ctx.beginPath();
        ctx.arc(x + (barWidth - gap) / 2, y, (barWidth - gap) / 2, 0, Math.PI, true);
        ctx.arc(x + (barWidth - gap) / 2, y + barHeight, (barWidth - gap) / 2, 0, Math.PI, false);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      source.disconnect();
    };
  }, [isRecording, audioContext, mediaStream, bars]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={60}
      className={cn(
        "w-full max-w-[300px] h-[60px]",
        className
      )}
    />
  );
}