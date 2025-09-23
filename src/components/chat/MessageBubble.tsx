import { cn } from "@/lib/utils";

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
          "max-w-[75%] rounded-2xl px-4 md:px-6 py-3 md:py-3.5 shadow-sm transition-all",
          isUser 
            ? "bg-muted rounded-br-md ml-4 md:ml-12" 
            : "bg-card border border-border rounded-bl-md mr-4 md:mr-12"
        )}
      >
        <p className={cn(
          "whitespace-pre-wrap break-words leading-relaxed text-foreground",
          isUser ? "text-sm" : "text-sm md:text-[15px]"
        )}>
          {message.text}
        </p>
      </div>
    </div>
  );
}