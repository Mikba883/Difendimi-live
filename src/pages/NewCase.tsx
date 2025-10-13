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
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { PrivacyBadge } from "@/components/premium/PrivacyBadge";
import { AuthDialog } from "@/components/premium/AuthDialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

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
  const { trackEvent } = useMetaPixel();
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
  const [showInvalidCaseDialog, setShowInvalidCaseDialog] = useState(false);
  const [invalidCaseMessage, setInvalidCaseMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedCaseId, setSavedCaseId] = useState<string | null>(null);
  const [generationTimer, setGenerationTimer] = useState(0);
  const [showGenerationTimer, setShowGenerationTimer] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isGenerateFunctionCalled, setIsGenerateFunctionCalled] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [hasTrackedStartTrial, setHasTrackedStartTrial] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Rimuoviamo il controllo di autenticazione iniziale
    // L'utente può accedere liberamente alla pagina
    // Add welcome message
    setMessages([{
      id: '1',
      text: "Ciao! Sono Lexy, il tuo assistente AI esperto in Diritto. Racconta in modo semplice e completo la situazione che vuoi risolvere. Dopo la tua descrizione, ti farò alcune domande mirate per completare l'analisi.",
      sender: 'assistant',
      timestamp: new Date()
    }]);
  }, []);

  // Timer visuale per la generazione del report (solo grafico)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showGenerationTimer) {
      interval = setInterval(() => {
        setGenerationTimer(prev => prev + 1);
      }, 1000);
    } else {
      setGenerationTimer(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showGenerationTimer]);
  
  // Pulisci completamente il vecchio codice di gestione automatica

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      // Trova il viewport effettivo di ScrollArea
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        setTimeout(() => {
          viewport.scrollTo({
            top: viewport.scrollHeight,
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  }, [messages]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
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
    if (!text.trim() || isSubmitting) return;
    
    // Previeni invii multipli
    setIsSubmitting(true);
    
    // Aggiungi il messaggio dell'utente
    const userMessage: Message = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setCurrentText(prev => prev + " " + text);
    
    // Track StartFreeTrial event quando l'utente invia il PRIMO messaggio
    if (messages.length === 1 && !hasTrackedStartTrial) { // First user message after welcome
      setHasTrackedStartTrial(true);
      trackEvent('StartFreeTrial', {
        custom_data: {
          source: 'new_case_chat',
          trial_type: 'legal_analysis'
        }
      });
      
      // Also track as Lead for Meta Pixel standard event
      trackEvent('Lead', {
        custom_data: {
          source: 'new_case_chat'
        }
      });
    }
    
    // Analizza il caso
    await analyzeCase(text);
    setIsSubmitting(false);
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
    
    try {
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
          currentQuestions: allQuestions,
          allQuestionsAnswered: false
        }
      });

      if (error) throw error;

      console.log('Response from precheck:', data);

      // Se è un messaggio di benvenuto (input non valido)
      if (data.status === 'welcome_message') {
        setMessages(prev => prev.slice(0, -1));
        setInvalidCaseMessage(data.message);
        setShowInvalidCaseDialog(true);
        setIsAnalyzing(false);
        setCurrentText("");
        return;
      }

      // FASE 1: Generazione domande iniziali
      if (data.phase === 'initial_analysis' && data.questions) {
        setCaseAnalysis(data.caseAnalysis);
        setAllQuestions(data.questions);
        setCompleteness(data.estimatedCompleteness || 20);
        
        setMessages(prev => prev.filter(m => !m.id.startsWith('thinking-')));
        
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
          
          const progress = Math.round(20 + (80 * (nextIndex + 1) / allQuestions.length));
          setCompleteness(progress);
          
          // Track CompleteFreeTrial event when reaching 100%
          if (progress === 100) {
            trackEvent('CompleteFreeTrial', {
              custom_data: {
                questions_answered: allQuestions.length,
                case_type: caseAnalysis?.caseType || 'general'
              }
            });
          }
        }
        return;
      }

      // FASE 3: Quando riceviamo status 'complete', inizia la generazione
      if (data.status === 'complete' && !isGeneratingReport && !isGenerateFunctionCalled) {
        console.log('✅ Tutte le risposte ricevute - generazione OTTIMIZZATA (30s invece di 50s)');
        setCompleteness(100);
        
        // Track CompleteFreeTrial event when all questions are answered
        trackEvent('CompleteFreeTrial', {
          custom_data: {
            questions_answered: allQuestions.length,
            case_type: caseAnalysis?.caseType || 'general'
          }
        });
        
        // Mostra messaggio "Ho raccolto tutto"
        const completionMsg: Message = {
          id: Date.now().toString() + '-completion',
          text: "Ho raccolto tutte le informazioni necessarie. Sto preparando il tuo report legale completo...",
          sender: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, completionMsg]);
        
        // Avvia timer visuale IMMEDIATAMENTE (ora solo 30 secondi totali)
        setShowGenerationTimer(true);
        setIsGeneratingReport(true);
        setIsGenerateFunctionCalled(true); // Previene chiamate duplicate
        
        // Chiama la funzione generate (ora senza analisi intermedia)
        console.log('📤 Chiamata DIRETTA a generate (senza ri-analisi)', data);
        callGenerateFunction(data);
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

  const callGenerateFunction = async (analysisData: any) => {
    console.log('=== CHIAMATA FUNZIONE GENERATE ===');
    console.log('analysisData:', analysisData);
    
    try {
      // Controlla se l'utente è autenticato
      const { data: { session } } = await supabase.auth.getSession();
      const isAuthenticated = !!session?.access_token;
      
      // Se non è autenticato, salva i dati e mostra il dialog BLOCCANTE
      if (!isAuthenticated) {
        console.log('Utente non autenticato, salvo dati e mostro dialog bloccante');
        
        // Salva tutti i dati necessari in localStorage
        const pendingCase = {
          job_id: analysisData.job_id,
          caseType: "general",
          messages: messages,
          currentText: currentText,
          allQuestions: allQuestions,
          caseAnalysis: analysisData.caseAnalysis,
          timestamp: Date.now()
        };
        
        localStorage.setItem('pending_case_generation', JSON.stringify(pendingCase));
        console.log('Dati salvati in localStorage:', pendingCase);
        
        // Mostra il dialog e blocca qui - la generazione riprenderà dopo il login
        setShowAuthDialog(true);
        return;
      }

      // L'utente è autenticato, procedi con la generazione
      console.log('Utente autenticato, procedo con generazione');
      
      // Track CompleteFreeTrial quando inizia la generazione con autenticazione
      trackEvent('CompleteFreeTrial', {
        custom_data: {
          job_id: analysisData.job_id,
          source: 'case_generation'
        }
      });
      
      setShowGenerationTimer(true);

      // Prepara i parametri corretti per la funzione generate
      const requestBody = {
        job_id: analysisData.job_id,
        caseType: "general",
        caseData: {
          previousContext: messages.map(m => `${m.sender === 'user' ? 'Utente' : 'Assistente'}: ${m.text}`).join('\n'),
          caseText: currentText,
        },
        meta: {
          authToken: `Bearer ${session.access_token}`,
          source: 'precheck',
          requestedAt: new Date().toISOString()
        }
      };

      console.log('Chiamata generate con parametri:', requestBody);

      const { data: generateData, error: generateError } = await supabase.functions.invoke('generate', {
        body: requestBody,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (generateError) throw generateError;

      console.log('Generazione completata:', generateData);
      
      // Track Lead event
      trackEvent('Lead', {
        custom_data: {
          case_id: generateData?.case_id,
          case_type: generateData?.case_type || 'general',
          source: 'ai_generation'
        }
      });
      
      // Naviga al caso completato
      if (generateData?.case_id) {
        console.log('Navigazione diretta al caso:', generateData.case_id);
        setIsComplete(true);
        setShowGenerationTimer(false);
        navigate(`/case/${generateData.case_id}`);
      } else {
        console.error('Nessun case_id ricevuto dalla funzione generate');
        throw new Error('Case ID non ricevuto');
      }
      
    } catch (error) {
      console.error('Errore durante la generazione:', error);
      setShowGenerationTimer(false);
      
      toast({
        title: "Errore generazione report",
        description: "Si è verificato un errore durante la generazione del report. Reindirizzamento...",
        variant: "destructive",
      });
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    }
  };

  // Nuova funzione per eseguire la generazione dopo il login
  const executePendingGeneration = async () => {
    console.log('=== ESECUZIONE GENERAZIONE PENDING ===');
    
    try {
      // Recupera i dati dal localStorage
      const pendingCaseStr = localStorage.getItem('pending_case_generation');
      if (!pendingCaseStr) {
        console.error('Nessun caso pending trovato in localStorage');
        return;
      }

      const pendingCase = JSON.parse(pendingCaseStr);
      console.log('Dati recuperati da localStorage:', pendingCase);

      // Ripristina lo stato se necessario
      if (pendingCase.messages) setMessages(pendingCase.messages);
      if (pendingCase.currentText) setCurrentText(pendingCase.currentText);
      if (pendingCase.allQuestions) setAllQuestions(pendingCase.allQuestions);

      // Ottieni la sessione corrente
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('Sessione non trovata dopo il login');
        toast({
          title: "Errore",
          description: "Sessione non valida, riprova",
          variant: "destructive",
        });
        return;
      }

      console.log('Sessione valida, procedo con generazione');
      
      // Track CompleteFreeTrial
      trackEvent('CompleteFreeTrial', {
        custom_data: {
          job_id: pendingCase.job_id,
          source: 'post_login'
        }
      });
      
      setShowGenerationTimer(true);

      // Prepara i parametri per generate
      const requestBody = {
        job_id: pendingCase.job_id,
        caseType: pendingCase.caseType,
        caseData: {
          previousContext: pendingCase.messages.map((m: Message) => 
            `${m.sender === 'user' ? 'Utente' : 'Assistente'}: ${m.text}`
          ).join('\n'),
          caseText: pendingCase.currentText,
        },
        meta: {
          authToken: `Bearer ${session.access_token}`,
          source: 'post_login',
          requestedAt: new Date().toISOString()
        }
      };

      console.log('Chiamata generate post-login con parametri:', requestBody);

      const { data: generateData, error: generateError } = await supabase.functions.invoke('generate', {
        body: requestBody,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (generateError) throw generateError;

      console.log('Generazione completata:', generateData);
      
      // Track Lead event
      trackEvent('Lead', {
        custom_data: {
          case_id: generateData?.case_id,
          case_type: generateData?.case_type || 'general',
          source: 'post_login'
        }
      });

      // Pulisci il localStorage
      localStorage.removeItem('pending_case_generation');
      console.log('localStorage pulito');

      // Naviga al caso completato
      if (generateData?.case_id) {
        console.log('Navigazione diretta al caso:', generateData.case_id);
        setIsComplete(true);
        setShowGenerationTimer(false);
        navigate(`/case/${generateData.case_id}`);
      } else {
        console.error('Nessun case_id ricevuto dalla funzione generate');
        throw new Error('Case ID non ricevuto');
      }

    } catch (error) {
      console.error('Errore durante la generazione post-login:', error);
      setShowGenerationTimer(false);
      localStorage.removeItem('pending_case_generation');
      
      toast({
        title: "Errore generazione report",
        description: "Si è verificato un errore durante la generazione del report.",
        variant: "destructive",
      });
    }
  };

  const saveCase = async (analysisData: any) => {
    // Previeni salvataggi multipli
    if (isSaving || savedCaseId) {
      console.log('Salvataggio già in corso o caso già salvato');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Prima controlla se esiste già un caso con lo stesso job_id
      if (analysisData.job_id) {
        const { data: existingCase, error: checkError } = await supabase
          .from('cases')
          .select('id')
          .eq('job_id', analysisData.job_id)
          .maybeSingle();
        
        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Errore controllo caso esistente:', checkError);
        }
        
        // Se il caso esiste già, naviga direttamente ad esso
        if (existingCase) {
          console.log('Caso già esistente, navigazione a:', existingCase.id);
          setSavedCaseId(existingCase.id);
          toast({
            title: "Caso già salvato",
            description: "Navigazione al caso esistente...",
          });
          navigate(`/case/${existingCase.id}`);
          return;
        }
      }

      // Inserisci il nuovo caso
      const { data: newCase, error } = await supabase
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
        })
        .select('id')
        .single();

      if (error) {
        // Se è un errore di chiave duplicata, prova a recuperare il caso esistente
        if (error.code === '23505' && analysisData.job_id) {
          const { data: existingCase } = await supabase
            .from('cases')
            .select('id')
            .eq('job_id', analysisData.job_id)
            .maybeSingle();
          
          if (existingCase) {
            setSavedCaseId(existingCase.id);
            toast({
              title: "Caso trovato",
              description: "Navigazione al caso esistente...",
            });
            navigate(`/case/${existingCase.id}`);
            return;
          }
        }
        throw error;
      }

      if (newCase && newCase.id) {
        setSavedCaseId(newCase.id);
        toast({
          title: "Successo",
          description: "Caso salvato correttamente. Reindirizzamento al caso...",
        });
        
        // Naviga direttamente alla pagina del caso invece che al dashboard
        navigate(`/case/${newCase.id}`);
      }
    } catch (error) {
      console.error('Error saving case:', error);
      toast({
        title: "Errore",
        description: "Impossibile salvare il caso. Riprova.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasMessages = messages.filter(m => m.sender === 'user').length > 0;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-background to-muted/5">
      {/* Header - sempre visibile con bottone Dashboard */}
      <div className="border-b bg-background/95 backdrop-blur-sm px-4 py-3 animate-fade-in">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>
              {completeness > 0 && (
                <span className="text-sm font-medium md:hidden">{completeness}%</span>
              )}
            </div>
            {completeness > 0 && hasMessages && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Analisi caso</span>
                <Progress value={completeness} className="h-2 flex-1" />
                <span className="text-sm font-medium hidden md:inline">{completeness}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vista iniziale centrata o Chat Area */}
      {!hasMessages ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 animate-fade-in">
          <div className="max-w-2xl w-full text-center space-y-12">
            <div className="space-y-6">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Lexy AI Assistant
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed mt-4 mb-2">
                Racconta in modo semplice e completo la situazione che vuoi risolvere
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
            
            {/* Privacy Badge */}
            <PrivacyBadge />
          </div>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
            <div className="max-w-3xl mx-auto py-6 space-y-5">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              
              {isAnalyzing && <TypingIndicator />}
              
              {showGenerationTimer && (
                <div className="flex items-center justify-center space-x-2 p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="text-sm text-muted-foreground">
                    Elaborazione in corso... {generationTimer > 0 && `(${generationTimer}s)`}
                  </span>
                </div>
              )}
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
                  isDisabled={isAnalyzing || isComplete || isSubmitting}
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

      {/* Dialog per input non validi */}
      <AlertDialog open={showInvalidCaseDialog} onOpenChange={setShowInvalidCaseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descrivi il tuo problema legale</AlertDialogTitle>
            <AlertDialogDescription>
              {invalidCaseMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowInvalidCaseDialog(false)}>
              Capito
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog di autenticazione */}
      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onAuthSuccess={async () => {
          console.log('Login completato, eseguo generazione pending');
          // Dopo il login, esegui la generazione con i dati salvati
          await executePendingGeneration();
        }}
      />
    </div>
  );
}