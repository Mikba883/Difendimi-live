import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MessageCircle, Mic, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isQuestion?: boolean;
  questionNumber?: number;
}

interface Question {
  id: number;
  text: string;
  category: string;
  importance: string;
  reason: string;
}

export default function NewCase() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [caseAnalysis, setCaseAnalysis] = useState<any>(null);
  const [completeness, setCompleteness] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
    // Add welcome message
    setMessages([{
      id: '1',
      text: "Ciao! Sono Lexy, il tuo assistente AI legale. Descrivimi il tuo problema legale nel modo più dettagliato possibile. Dopo la tua descrizione, ti farò alcune domande mirate per completare l'analisi.",
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
      
      // Set up audio context and stream for waveform visualization
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      mediaStreamRef.current = stream;
      
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
        mediaStreamRef.current = null;
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Errore",
        description: "Impossibile accedere al microfono. Verifica i permessi.",
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
      console.log('Processing audio, size:', audioBlob.size);
      setIsProcessingAudio(true);
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        if (!base64Audio) {
          setIsProcessingAudio(false);
          throw new Error('Failed to convert audio to base64');
        }
        
        console.log('Sending audio to STT function');
        
        const { data, error } = await supabase.functions.invoke('stt', {
          body: { audio: base64Audio }
        });

        if (error) {
          console.error('STT error:', error);
          setIsProcessingAudio(false);
          throw error;
        }
        
        const transcribedText = data?.text || '';
        console.log('Transcription result:', transcribedText);
        
        if (transcribedText) {
          // Set transcribed text as preview instead of sending immediately
          setTranscribedText(transcribedText);
          setIsProcessingAudio(false);
        } else {
          setIsProcessingAudio(false);
          toast({
            title: "Nessun audio rilevato",
            description: "Non è stato possibile trascrivere l'audio. Riprova.",
          });
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error processing audio:', error);
      setIsProcessingAudio(false);
      toast({
        title: "Errore di trascrizione",
        description: "Si è verificato un errore durante la trascrizione. Riprova.",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    // Aggiungi il messaggio dell'utente
    const userMessage: Message = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setCurrentText(prev => prev + " " + text);
    
    // Analizza il caso
    await analyzeCase(text);
  };

  const analyzeCase = async (latestResponse: string) => {
    if (!latestResponse.trim()) {
      toast({
        title: "Attenzione",
        description: "Inserisci o detta le informazioni del caso",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    // Se è la prima analisi, mostra messaggio di "pensiero"
    if (allQuestions.length === 0) {
      const thinkingMessage: Message = {
        id: 'thinking-' + Date.now(),
        text: "Fammi pensare un attimo alla tua situazione... Sto analizzando il caso per identificare le informazioni essenziali che mi servono.",
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, thinkingMessage]);
    }
    
    try {
      // Prepara il contesto precedente (escluso l'ultimo messaggio appena aggiunto e il messaggio di thinking se presente)
      const previousMessages = messages
        .filter(m => !m.id.startsWith('thinking-'))
        .slice(0, -1)
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }));

      console.log('=== ANALYZE CASE ===');
      console.log('Phase:', allQuestions.length === 0 ? 'initial' : 'answering');
      console.log('Current questions:', allQuestions.length);
      console.log('Current question index:', currentQuestionIndex);

      const { data, error } = await supabase.functions.invoke('precheck', {
        body: { 
          latestResponse,
          previousContext: previousMessages,
          currentQuestions: allQuestions
        }
      });

      if (error) throw error;

      console.log('Response from precheck:', data);

      // FASE 1: Generazione domande iniziali
      if (data.phase === 'initial_analysis' && data.questions) {
        setCaseAnalysis(data.caseAnalysis);
        setAllQuestions(data.questions);
        setCompleteness(data.estimatedCompleteness || 20);
        
        // Rimuovi il messaggio di "pensiero" e mostra le domande
        setMessages(prev => prev.filter(m => !m.id.startsWith('thinking-')));
        
        // Mostra la prima domanda dopo un breve delay
        setTimeout(() => {
          if (data.questions.length > 0) {
            const firstQuestion: Message = {
              id: Date.now().toString() + '-q',
              text: data.questions[0].text,
              sender: 'assistant',
              timestamp: new Date(),
              isQuestion: true,
              questionNumber: 1
            };
            setMessages(prev => [...prev, firstQuestion]);
            setCurrentQuestionIndex(1);
          }
        }, 800);
        
        return;
      }

      // FASE 2: Gestione risposte alle domande
      if (data.status === 'waiting_responses') {
        // Incrementa l'indice e mostra la prossima domanda
        const nextIndex = currentQuestionIndex;
        if (nextIndex < allQuestions.length) {
          const nextQuestion = allQuestions[nextIndex];
          const questionMessage: Message = {
            id: Date.now().toString() + '-q',
            text: nextQuestion.text,
            sender: 'assistant',
            timestamp: new Date(),
            isQuestion: true,
            questionNumber: nextIndex + 1
          };
          setMessages(prev => [...prev, questionMessage]);
          setCurrentQuestionIndex(nextIndex + 1);
          
          // Aggiorna completezza progressivamente
          const progress = Math.round(20 + (80 * (nextIndex + 1) / allQuestions.length));
          setCompleteness(progress);
        }
        return;
      }

      // FASE 3: Caso completo
      if (data.status === 'complete' || data.status === 'queued') {
        setIsComplete(true);
        setCompleteness(100);
        
        const completionMessage: Message = {
          id: Date.now().toString(),
          text: "Perfetto! Ho raccolto tutte le informazioni necessarie. Ora preparo il tuo report legale completo con strategie personalizzate e documenti consigliati.",
          sender: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, completionMessage]);
        
        // Salva il caso
        setTimeout(async () => {
          await saveCase({
            ...data,
            caseAnalysis,
            allQuestions,
            messages
          });
        }, 2000);
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

  const saveCase = async (analysisData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('cases')
        .insert({
          created_by: user.id,
          title: `Caso del ${new Date().toLocaleDateString('it-IT')}`,
          job_id: analysisData.job_id,
          status: analysisData.job_id ? 'queued' : 'ready',
          case_type: analysisData.caseAnalysis?.caseType || 'general',
          case_text: currentText,
          previous_context: JSON.stringify(messages),
          report: {
            executive_summary: {
              summary: analysisData.analysis?.summary || "Analisi in corso..."
            }
          },
          cards_json: {
            originalText: currentText,
            conversation: messages.map(m => ({
              text: m.text,
              sender: m.sender,
              timestamp: m.timestamp.toISOString()
            })),
            questions: allQuestions.map(q => ({
              id: q.id,
              text: q.text,
              category: q.category,
              importance: q.importance,
              reason: q.reason
            })),
            analysis: analysisData.analysis || analysisData.caseAnalysis
          }
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
                <h1 className="text-lg font-semibold">Nuovo Caso</h1>
                <p className="text-xs text-muted-foreground">Lexy AI Assistant</p>
              </div>
            </div>
            {completeness > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Analisi</span>
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
                Lexy AI Assistant
              </h1>
              <p className="text-xl text-muted-foreground">
                Descrivimi dettagliatamente il tuo problema legale
              </p>
            </div>
            
            <div className="w-full bg-card/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <ChatInput
              onSendMessage={handleSendMessage}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
              isRecording={isRecording}
              isProcessingAudio={isProcessingAudio}
              transcribedText={transcribedText}
              onClearTranscription={() => setTranscribedText("")}
              isDisabled={isAnalyzing || isComplete}
              placeholder="Descrivi il tuo caso nel modo più completo possibile..."
              audioContext={audioContextRef.current || undefined}
              mediaStream={mediaStreamRef.current || undefined}
            />
            </div>
            
            <div className="flex justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 hover:text-foreground transition-colors">
                <MessageCircle className="h-4 w-4" />
                <span>Analisi intelligente</span>
              </div>
              <div className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Mic className="h-4 w-4" />
                <span>Input vocale</span>
              </div>
              <div className="flex items-center gap-2 hover:text-foreground transition-colors">
                <FileText className="h-4 w-4" />
                <span>Report completo</span>
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
            </div>
          </ScrollArea>

          {/* Input area - solo quando ci sono messaggi e non è completo */}
          {!isComplete && (
            <div className="bg-background/95 backdrop-blur-sm px-4 py-4">
              <div className="max-w-3xl mx-auto">
                <ChatInput
                  onSendMessage={handleSendMessage}
                  onStartRecording={startRecording}
                  onStopRecording={stopRecording}
                  isRecording={isRecording}
                  isProcessingAudio={isProcessingAudio}
                  transcribedText={transcribedText}
                  onClearTranscription={() => setTranscribedText("")}
                  isDisabled={isAnalyzing || isComplete}
                  placeholder={
                    currentQuestionIndex > 0 
                      ? "Rispondi alla domanda..." 
                      : "Continua a descrivere il tuo caso..."
                  }
                  audioContext={audioContextRef.current || undefined}
                  mediaStream={mediaStreamRef.current || undefined}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}