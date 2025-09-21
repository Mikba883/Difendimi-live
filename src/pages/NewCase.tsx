import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mic, MicOff, Volume2, Send, ArrowLeft, Loader2 } from "lucide-react";

export default function NewCase() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [caseText, setCaseText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [completeness, setCompleteness] = useState(0);
  const [analysis, setAnalysis] = useState<any>(null);
  const [conversation, setConversation] = useState<string[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    checkAuth();
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
          setCaseText(prev => prev + " " + data.text);
          setConversation(prev => [...prev, `Tu: ${data.text}`]);
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

  const analyzeCase = async () => {
    if (!caseText.trim()) {
      toast({
        title: "Attenzione",
        description: "Inserisci o detta le informazioni del caso",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('precheck', {
        body: { 
          caseText,
          caseType: 'general',
          previousContext: conversation.join('\n')
        }
      });

      if (error) throw error;

      setAnalysis(data);
      setCompleteness(data.completeness.score);

      // Se ci sono domande successive, pronunciale
      if (data.nextQuestion?.text) {
        setConversation(prev => [...prev, `Assistente: ${data.nextQuestion.text}`]);
        await speakText(data.nextQuestion.text);
      }

      // Se il caso è sufficientemente completo, salva
      if (data.completeness.status === 'complete' || data.completeness.status === 'sufficient') {
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
            originalText: caseText,
            conversation,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Torna alla Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Nuovo Caso Legale</CardTitle>
            <CardDescription>
              Descrivi o detta il tuo caso. L'assistente AI ti guiderà con domande mirate.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Completezza informazioni</span>
                <span>{completeness}%</span>
              </div>
              <Progress value={completeness} className="h-2" />
            </div>

            {/* Text area */}
            <div className="space-y-2">
              <Textarea
                placeholder="Descrivi il tuo caso legale qui..."
                value={caseText}
                onChange={(e) => setCaseText(e.target.value)}
                className="min-h-[200px]"
              />
            </div>

            {/* Conversation history */}
            {conversation.length > 0 && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {conversation.map((msg, idx) => (
                      <p key={idx} className={msg.startsWith('Tu:') ? 'text-primary' : 'text-muted-foreground'}>
                        {msg}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Analysis results */}
            {analysis && analysis.completeness.missingElements?.length > 0 && (
              <Card className="border-warning">
                <CardContent className="pt-4">
                  <p className="text-sm font-medium mb-2">Informazioni mancanti:</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {analysis.completeness.missingElements.map((element: string, idx: number) => (
                      <li key={idx}>{element}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Action buttons */}
            <div className="flex gap-4 justify-center">
              <Button
                variant={isRecording ? "destructive" : "outline"}
                size="lg"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isAnalyzing || isSpeaking}
              >
                {isRecording ? (
                  <>
                    <MicOff className="mr-2 h-5 w-5" />
                    Stop Registrazione
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-5 w-5" />
                    Registra Audio
                  </>
                )}
              </Button>

              <Button
                size="lg"
                onClick={analyzeCase}
                disabled={isAnalyzing || isRecording || !caseText.trim()}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analisi in corso...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Analizza Caso
                  </>
                )}
              </Button>

              {isSpeaking && (
                <Button variant="ghost" size="lg" disabled>
                  <Volume2 className="mr-2 h-5 w-5 animate-pulse" />
                  Ascolto risposta...
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}