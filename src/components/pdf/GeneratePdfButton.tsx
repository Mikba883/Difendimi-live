import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { PdfDocumentCard } from "./PdfDocumentCard";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import { useNavigate } from "react-router-dom";

interface GeneratePdfButtonProps {
  caseId: string;
  caseStatus: string;
}

interface PdfDocument {
  id: string;
  title: string;
  rationale: string;
  content: string;
  size_bytes: number;
}

export function GeneratePdfButton({ caseId, caseStatus }: GeneratePdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [documents, setDocuments] = useState<PdfDocument[]>([]);
  const [summary, setSummary] = useState<string>("");
  const { isPremium, loading } = usePremiumStatus();
  const navigate = useNavigate();

  const handleGeneratePdf = async () => {
    // Check premium status first
    if (!isPremium) {
      navigate("/premium");
      return;
    }
    try {
      setIsGenerating(true);
      setDocuments([]);
      setSummary("");

      const response = await supabase.functions.invoke('generate-pdf', {
        body: { caseId }
      });

      if (response.error) {
        console.error('Edge function error:', response.error);
        throw response.error;
      }

      if (!response.data) {
        throw new Error('Nessun dato ricevuto dalla funzione');
      }

      const { documents: generatedDocs, summary, success, error, details } = response.data;
      
      // Validate response structure
      if (!success) {
        console.error('PDF generation failed:', response.data);
        const errorMessage = error || 'Errore nella generazione dei PDF';
        const fullError = details ? `${errorMessage}\n\nDettagli: ${details}` : errorMessage;
        throw new Error(fullError);
      }
      
      // Validate documents
      if (!generatedDocs || !Array.isArray(generatedDocs)) {
        console.error('Invalid documents received:', generatedDocs);
        throw new Error('Formato documenti non valido');
      }

      setDocuments(generatedDocs);
      setSummary(summary || "");
      
      toast({
        title: "PDF generati con successo",
        description: `Sono stati generati ${generatedDocs.length} documenti`,
      });
    } catch (error) {
      console.error('Error generating PDFs:', error);
      toast({
        title: "Errore",
        description: error.message || "Impossibile generare i PDF",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Only show button for ready cases
  if (caseStatus !== 'ready') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Generate button as a beautiful card */}
      {documents.length === 0 && (
        <Card className="overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <FileText className="h-10 w-10 text-primary" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Genera il Dossier Completo</h2>
                <p className="text-muted-foreground max-w-md">
                  Trasforma il tuo caso in un pacchetto di documenti PDF ordinati e completi: con bozze pronte (email, diffide, istanze, ecc..)
                </p>
              </div>
              
              <Button
                onClick={handleGeneratePdf}
                disabled={isGenerating || loading}
                size="lg"
                className="gap-2 px-8"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generazione in corso...
                  </>
                ) : !isPremium ? (
                  <>
                    <Lock className="h-5 w-5" />
                    Genera Dossier (Premium)
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5" />
                    Genera Dossier
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {summary && (
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Riepilogo caso (anonimizzato):</p>
          <p className="text-sm text-muted-foreground">{summary}</p>
        </div>
      )}

      {/* Document cards */}
      {documents.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Documenti Generati</h3>
            <Button
              onClick={handleGeneratePdf}
              disabled={isGenerating}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Rigenerazione...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Rigenera
                </>
              )}
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {documents.map((doc) => (
              <PdfDocumentCard
                key={doc.id}
                document={doc}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}