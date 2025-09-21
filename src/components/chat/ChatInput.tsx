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
    <div className="bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative flex items-end gap-2 bg-muted/30 rounded-3xl p-2">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isDisabled || isRecording}
            className={cn(
              "flex-1 resize-none bg-transparent px-4 py-2",
              "text-sm placeholder:text-muted-foreground",
              "focus:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "min-h-[36px] max-h-[200px] transition-all"
            )}
            rows={1}
          />
          <div className="flex gap-1 pb-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={isRecording ? onStopRecording : onStartRecording}
              disabled={isDisabled}
              className={cn(
                "h-8 w-8 rounded-full",
                isRecording && "bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
              )}
            >
              {isRecording ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            <Button
              onClick={handleSend}
              disabled={isRecording}
              size="icon"
              className={cn(
                "h-8 w-8 rounded-full transition-all",
                !inputText.trim() || isDisabled
                  ? "bg-muted-foreground/20 hover:bg-muted-foreground/20 cursor-not-allowed"
                  : "bg-foreground hover:bg-foreground/90",
                isDisabled && "opacity-50"
              )}
            >
              {isDisabled ? (
                <Square className="h-3 w-3 text-background" />
              ) : (
                <ArrowUp className="h-4 w-4 text-background" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}