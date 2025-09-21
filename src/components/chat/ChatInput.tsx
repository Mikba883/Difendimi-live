import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Mic, MicOff } from "lucide-react";
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
    <div className="bg-background border-t border-border p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isDisabled || isRecording}
              className={cn(
                "w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 pr-12",
                "text-sm placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "min-h-[52px] max-h-[200px] transition-all"
              )}
              rows={1}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={isRecording ? onStopRecording : onStartRecording}
              disabled={isDisabled}
              className={cn(
                "absolute right-2 bottom-2 h-8 w-8 rounded-full",
                isRecording && "text-destructive hover:text-destructive"
              )}
            >
              {isRecording ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          </div>
          <Button
            onClick={handleSend}
            disabled={!inputText.trim() || isDisabled || isRecording}
            size="icon"
            className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}