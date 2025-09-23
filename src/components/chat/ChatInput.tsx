import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, Mic, CheckCircle, XCircle } from "lucide-react";
import { VoiceRecordingInput } from "./VoiceRecordingInput";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isRecording: boolean;
  isProcessingAudio?: boolean;
  transcribedText?: string;
  onClearTranscription?: () => void;
  isDisabled?: boolean;
  placeholder?: string;
  audioContext?: AudioContext;
  mediaStream?: MediaStream;
}

export function ChatInput({
  onSendMessage,
  onStartRecording,
  onStopRecording,
  isRecording,
  isProcessingAudio = false,
  transcribedText = "",
  onClearTranscription,
  isDisabled = false,
  placeholder = "Descrivi il tuo caso...",
  audioContext,
  mediaStream
}: ChatInputProps) {
  const [inputText, setInputText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showTranscriptionPreview, setShowTranscriptionPreview] = useState(false);

  // Update input text when transcription is received
  useEffect(() => {
    if (transcribedText) {
      setInputText(transcribedText);
      setShowTranscriptionPreview(true);
    }
  }, [transcribedText]);

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
      setShowTranscriptionPreview(false);
      onClearTranscription?.();
    }
  };

  const handleCancelTranscription = () => {
    setInputText("");
    setShowTranscriptionPreview(false);
    onClearTranscription?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Voice Recording UI */}
      {(isRecording || isProcessingAudio) && (
        <VoiceRecordingInput
          isRecording={isRecording}
          isProcessing={isProcessingAudio}
          onStopRecording={onStopRecording}
          audioContext={audioContext}
          mediaStream={mediaStream}
        />
      )}

      {/* Text Input UI */}
      {!isRecording && !isProcessingAudio && (
        <div className={cn(
          "relative bg-card/50 backdrop-blur-sm rounded-2xl p-3 border border-border shadow-md",
          "animate-in fade-in slide-in-from-bottom-2 duration-300"
        )}>
          {showTranscriptionPreview && (
            <div className="flex items-center gap-2 mb-2 px-3 py-1 bg-primary/5 rounded-lg">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Trascrizione completata - Modifica o invia il messaggio</span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={handleCancelTranscription}
                className="h-6 w-6 ml-auto"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <div className="flex flex-wrap items-end gap-2">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                setShowTranscriptionPreview(false);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isDisabled}
              className={cn(
                "flex-1 min-w-0 resize-none bg-transparent px-4 py-3",
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
                onClick={onStartRecording}
                disabled={isDisabled}
                className="h-10 w-10 rounded-full transition-colors duration-200 hover:bg-muted"
              >
                <Mic className="h-5 w-5" />
              </Button>
              <Button
                onClick={handleSend}
                disabled={!inputText.trim() || isDisabled}
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-full transition-all",
                  !inputText.trim() || isDisabled
                    ? "bg-muted-foreground/20 hover:bg-muted-foreground/20 cursor-not-allowed opacity-50"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                )}
              >
                <ArrowUp className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}