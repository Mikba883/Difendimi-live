import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Volume2, MessageCircle, Mic, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export default function NewCase() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [completeness, setCompleteness] = useState(0);
  const [analysis, setAnalysis] = useState<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [currentText, setCurrentText] = useState("");

  useEffect(() => {
    checkAuth();
    // Add welcome message
    setMessages([{
      id: '1',
      text: "Ciao! Sono il tuo assistente legale AI. Descrivimi il tuo caso e ti guiderò con domande mirate per raccogliere tutte le informazioni necessarie.",
      sender: 'assistant',
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Errore",
        description: "Impossibile accedere al microfono",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('stt', {
          body: { audio: base64Audio }
        });

        if (error) throw error;
        
        if (data?.text) {
          const newMessage: Message = {
            id: Date.now().toString(),
            text: data.text,
            sender: 'user',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, newMessage]);
          setCurrentText(prev => prev + " " + data.text);
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Errore",
        description: "Impossibile processare l'audio",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (text: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setCurrentText(prev => prev + " " + text);
    
    // Analyze the case
    await analyzeCase(text);
  };

  const analyzeCase = async (newText?: string) => {
    const textToAnalyze = newText ? currentText + " " + newText : currentText;
    
    if (!textToAnalyze.trim()) {
      toast({
        title: "Attenzione",
        description: "Inserisci o detta le informazioni del caso",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const conversationContext = messages
        .map(m => `${m.sender === 'user' ? 'Tu' : 'Assistente'}: ${m.text}`)
        .join('\n');

      const { data, error } = await supabase.functions.invoke('precheck', {
        body: { 
          caseText: textToAnalyze,
          caseType: 'general',
          previousContext: conversationContext
        }
      });

      if (error) throw error;

      setAnalysis(data);
      setCompleteness(data.completeness.score);

      // Add assistant response
      if (data.nextQuestion?.text) {
        const assistantMessage: Message = {
          id: Date.now().toString(),
          text: data.nextQuestion.text,
          sender: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        await speakText(data.nextQuestion.text);
      }

      // Se il caso è sufficientemente completo, salva
      if (data.completeness.status === 'complete' || data.completeness.status === 'sufficient') {
        const completionMessage: Message = {
          id: Date.now().toString(),
          text: "Perfetto! Ho raccolto tutte le informazioni necessarie. Il tuo caso è stato salvato e analizzato con successo.",
          sender: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, completionMessage]);
        await saveCase(data);
      }

    } catch (error) {
      console.error('Error analyzing case:', error);
      toast({
        title: "Errore",
        description: "Impossibile analizzare il caso",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const speakText = async (text: string) => {
    try {
      setIsSpeaking(true);
      const { data, error } = await supabase.functions.invoke('tts', {
        body: { text }
      });

      if (error) throw error;

      if (data?.audio) {
        const audioData = atob(data.audio);
        const audioArray = new Uint8Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
          audioArray[i] = audioData.charCodeAt(i);
        }
        
        const audioBlob = new Blob([audioArray], { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
      }
    } catch (error) {
      console.error('Error speaking text:', error);
      setIsSpeaking(false);
    }
  };

  const saveCase = async (analysisData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('cases')
        .insert({
          user_id: user.id,
          title: `Caso del ${new Date().toLocaleDateString('it-IT')}`,
          cards_json: {
            originalText: currentText,
            conversation: messages.map(m => ({
              text: m.text,
              sender: m.sender,
              timestamp: m.timestamp.toISOString()
            })),
            analysis: analysisData.analysis,
            completeness: analysisData.completeness
          },
          doc_availability: {
            relazione: analysisData.analysis.recommendedDocuments?.includes('relazione') || false,
            diffida: analysisData.analysis.recommendedDocuments?.includes('diffida') || false,
            adr: analysisData.analysis.recommendedDocuments?.includes('adr') || false
          },
          sources_used: analysisData.analysis.suggestedKeywords
        });

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Caso salvato correttamente",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving case:', error);
      toast({
        title: "Errore",
        description: "Impossibile salvare il caso",
        variant: "destructive",
      });
    }
  };

  const hasMessages = messages.filter(m => m.sender === 'user').length > 0;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-background to-muted/5">
      {/* Header - solo se ci sono messaggi */}
      {hasMessages && (
        <div className="border-b bg-background/95 backdrop-blur-sm px-4 py-3 animate-fade-in">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
              <div>
                <h1 className="text-lg font-semibold">Nuovo Caso Legale</h1>
                <p className="text-xs text-muted-foreground">Assistente AI Legale</p>
              </div>
            </div>
            {completeness > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Completezza</span>
                <Progress value={completeness} className="h-2 w-24" />
                <span className="text-sm font-medium">{completeness}%</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vista iniziale centrata o Chat Area */}
      {!hasMessages ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 animate-fade-in">
          <div className="max-w-2xl w-full text-center space-y-12">
            <div className="space-y-4">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Assistente Legale AI
              </h1>
              <p className="text-xl text-muted-foreground">
                Sono qui per aiutarti ad analizzare il tuo caso legale
              </p>
            </div>
            
            <div className="w-full bg-card/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <ChatInput
                onSendMessage={handleSendMessage}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                isRecording={isRecording}
                isDisabled={isAnalyzing}
                placeholder="Inizia a descrivere il tuo caso..."
              />
            </div>
            
            <div className="flex justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 hover:text-foreground transition-colors">
                <MessageCircle className="h-4 w-4" />
                <span>Chat interattiva</span>
              </div>
              <div className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Mic className="h-4 w-4" />
                <span>Input vocale</span>
              </div>
              <div className="flex items-center gap-2 hover:text-foreground transition-colors">
                <FileText className="h-4 w-4" />
                <span>Analisi completa</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1 px-4">
            <div 
              ref={scrollAreaRef}
              className="max-w-3xl mx-auto py-6 space-y-5"
            >
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              
              {isAnalyzing && <TypingIndicator />}
              
              {isSpeaking && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm animate-fade-in">
                  <Volume2 className="h-4 w-4 animate-pulse" />
                  <span>Riproduzione audio in corso...</span>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input area - solo quando ci sono messaggi */}
          <div className="border-t bg-background/95 backdrop-blur-sm px-4 py-4">
            <div className="max-w-3xl mx-auto">
              <ChatInput
                onSendMessage={handleSendMessage}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                isRecording={isRecording}
                isDisabled={isAnalyzing || isSpeaking}
                placeholder="Continua a descrivere il tuo caso..."
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}