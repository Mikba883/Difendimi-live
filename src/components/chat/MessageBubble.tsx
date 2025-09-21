import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface MessageBubbleProps {
  message: {
    id: string;
    text: string;
    sender: 'user' | 'assistant';
    timestamp: Date;
  };
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  
  return (
    <div
      className={cn(
        "flex w-full animate-fade-in",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-2 shadow-sm",
          isUser 
            ? "bg-primary text-primary-foreground rounded-br-sm" 
            : "bg-muted rounded-bl-sm"
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.text}
        </p>
        <span className={cn(
          "text-xs mt-1 block",
          isUser ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {format(message.timestamp, 'HH:mm', { locale: it })}
        </span>
      </div>
    </div>
  );
}