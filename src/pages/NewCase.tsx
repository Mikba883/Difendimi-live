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
  const [isTyping, setIsTyping] = useState(false);
  const [pollingCaseId, setPollingCaseId] = useState<string | null>(null);
  const [generationMessage, setGenerationMessage] = useState<string>('');
  const [hasStarted, setHasStarted] = useState(false); // New state for tracking if conversation started
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Reset all state when component mounts
    setMessages([{
      id: '1',
      text: "Ciao! Sono Lexy, il tuo assistente AI legale. Descrivimi il tuo problema legale nel modo più dettagliato possibile. Dopo la tua descrizione, ti farò alcune domande mirate per completare l'analisi.",
      sender: 'assistant',
      timestamp: new Date()
    }]);
    setIsRecording(false);
    setIsProcessingAudio(false);
    setTranscribedText("");
    setIsAnalyzing(false);
    setCurrentText("");
    setAllQuestions([]);
    setCurrentQuestionIndex(0);
    setIsComplete(false);
    setCaseAnalysis(null);
    setCompleteness(0);
    setIsTyping(false);
    setPollingCaseId(null);
    setGenerationMessage('');
    
    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    checkAuth();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    }, 100);
  }, [messages]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

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
    setIsProcessingAudio(true);
    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Remove the data:audio/webm;base64, prefix
          const base64Audio = base64.split(',')[1];
          resolve(base64Audio);
        };
        reader.onerror = reject;
      });
      
      reader.readAsDataURL(audioBlob);
      const audioBase64 = await base64Promise;
      
      const { data, error } = await supabase.functions.invoke('stt', {
        body: { audio: audioBase64 },
      });

      if (error) throw error;
      
      if (data?.text) {
        setTranscribedText(data.text);
        // Automatically send the transcribed text
        handleSendMessage(data.text);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Errore",
        description: "Impossibile elaborare l'audio",
        variant: "destructive",
      });
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    // Start conversation if not started
    if (!hasStarted) {
      setHasStarted(true);
    }
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setTranscribedText('');
    setCurrentText(text.trim());
    
    // If this is the first message, save as current text and analyze
    if (allQuestions.length === 0) {
      await analyzeCase(text.trim());
    } else {
      // It's an answer to a question
      await analyzeCase(text.trim());
    }
  };

  const analyzeCase = async (latestResponse: string) => {
    if (isAnalyzing) {
      console.warn('Already analyzing, skipping duplicate call');
      return;
    }

    setIsAnalyzing(true);
    
    // Se è la prima analisi, mostra solo l'indicatore di digitazione
    if (allQuestions.length === 0) {
      setIsTyping(true);
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
      
      // Verifica se tutte le domande hanno ricevuto risposta
      const allQuestionsAnswered = currentQuestionIndex >= allQuestions.length && allQuestions.length > 0;
      console.log('All questions answered:', allQuestionsAnswered);

      const { data, error } = await supabase.functions.invoke('precheck', {
        body: { 
          latestResponse,
          previousContext: previousMessages,
          currentQuestions: allQuestions,
          allQuestionsAnswered // Passa questo flag a precheck
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
        setIsTyping(false);
        
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

      // FASE 3: Caso completo - polling per generazione report
      if (data.status === 'complete') {
        setIsComplete(true);
        setCompleteness(100);
        
        // Start polling for case generation
        if (data.jobId) {
          setPollingCaseId(data.jobId);
          setGenerationMessage('Sto generando il tuo report legale...');
          pollCaseStatus(data.jobId);
        }
        
        const completionMessage: Message = {
          id: Date.now().toString(),
          text: "Perfetto! Ho raccolto tutte le informazioni necessarie. Ora preparo il tuo report legale completo. Questo potrebbe richiedere alcuni secondi...",
          sender: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, completionMessage]);
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

  const pollCaseStatus = async (jobId: string) => {
    let attemptCount = 0;
    const maxAttempts = 30; // 30 attempts * 2 seconds = 1 minute max
    
    const messages = [
      "Sto analizzando il tuo caso...",
      "Sto cercando le normative rilevanti...",
      "Sto preparando il report legale...",
      "Quasi fatto, ancora qualche secondo...",
    ];
    
    pollingIntervalRef.current = setInterval(async () => {
      attemptCount++;
      
      // Update generation message
      const messageIndex = Math.min(Math.floor(attemptCount / 5), messages.length - 1);
      setGenerationMessage(messages[messageIndex]);
      
      try {
        const { data, error } = await supabase
          .from('cases')
          .select('id, status')
          .eq('job_id', jobId)
          .single();
        
        if (error) {
          console.error('Errore polling:', error);
          return;
        }
        
        if (data && data.status === 'ready') {
          // Case is ready!
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          setPollingCaseId(null);
          setGenerationMessage('');
          
          // Navigate to case detail
          navigate(`/case/${data.id}`);
        } else if (data && data.status === 'error') {
          // Error occurred
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          setPollingCaseId(null);
          setGenerationMessage('');
          
          toast({
            title: "Errore nella generazione",
            description: "Si è verificato un errore durante la generazione del report.",
            variant: "destructive",
          });
        }
        
        if (attemptCount >= maxAttempts) {
          // Timeout
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          setPollingCaseId(null);
          setGenerationMessage('');
          
          toast({
            title: "Timeout",
            description: "La generazione del report sta richiedendo più tempo del previsto. Controlla più tardi nella dashboard.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Errore nel polling:', error);
      }
    }, 2000); // Poll every 2 seconds
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
            summary: analysisData.analysis?.summary || "Analisi in corso...",
            recommendations: analysisData.analysis?.recommendations || []
          }
        });

      if (error) throw error;

      // Navigate to dashboard to see the new case
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

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Nuovo Caso</h1>
                <p className="text-xs text-muted-foreground">Analisi assistita AI</p>
              </div>
            </div>
            {completeness > 0 && (
              <div className="flex items-center gap-3 min-w-[200px]">
                <Progress value={completeness} className="h-2" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {completeness}% completato
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
        <div className="max-w-3xl mx-auto py-4 space-y-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
            />
          ))}
          {isTyping && <TypingIndicator />}
        </div>
        <div className="h-4" /> {/* Bottom padding */}
      </ScrollArea>

      {/* Input Area or Generation Loading */}
      {!isComplete && !pollingCaseId && (
        <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              onSendMessage={handleSendMessage}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
              isRecording={isRecording}
              isDisabled={isAnalyzing || isProcessingAudio}
              transcribedText={transcribedText}
              isProcessingAudio={isProcessingAudio}
              audioContext={audioContextRef.current || undefined}
              mediaStream={mediaStreamRef.current || undefined}
            />
          </div>
        </div>
      )}
      
      {/* Generation loading state */}
      {pollingCaseId && (
        <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {generationMessage || 'Generazione del report in corso...'}
            </h3>
            <p className="text-sm text-muted-foreground">
              Questo processo richiede solitamente 10-20 secondi
            </p>
            <div className="w-full max-w-xs mx-auto">
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
