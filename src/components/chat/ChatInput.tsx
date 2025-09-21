import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, Square, Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isRecording: boolean;
  isDisabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSendMessage,
  onStartRecording,
  onStopRecording,
  isRecording,
  isDisabled = false,
  placeholder = "Descrivi il tuo caso..."
}: ChatInputProps) {
  const [inputText, setInputText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputText]);

  const handleSend = () => {
    if (inputText.trim() && !isDisabled) {
      onSendMessage(inputText.trim());
      setInputText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative flex items-end gap-2 bg-card/50 backdrop-blur-sm rounded-2xl p-3 border border-border shadow-md">
      <textarea
        ref={textareaRef}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isDisabled || isRecording}
        className={cn(
          "flex-1 resize-none bg-transparent px-4 py-3",
          "text-[15px] placeholder:text-muted-foreground",
          "focus:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "min-h-[52px] max-h-[200px] transition-all"
        )}
        rows={1}
      />
      <div className="flex gap-2 pb-1">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={isRecording ? onStopRecording : onStartRecording}
          disabled={isDisabled}
          className={cn(
            "h-10 w-10 rounded-full transition-all hover:bg-muted",
            isRecording && "bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive animate-pulse"
          )}
        >
          {isRecording ? (
            <MicOff className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </Button>
        <Button
          onClick={handleSend}
          disabled={isRecording || !inputText.trim() || isDisabled}
          size="icon"
          className={cn(
            "h-10 w-10 rounded-full transition-all",
            !inputText.trim() || isDisabled
              ? "bg-muted hover:bg-muted cursor-not-allowed opacity-50"
              : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          )}
        >
          {isDisabled ? (
            <Square className="h-4 w-4" />
          ) : (
            <ArrowUp className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}