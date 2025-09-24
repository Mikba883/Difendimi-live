import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { PdfDocumentCard } from "./PdfDocumentCard";

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

  const handleGeneratePdf = async () => {
    try {
      setIsGenerating(true);
      setDocuments([]);
      setSummary("");

      const { data, error } = await supabase.functions.invoke('generate-pdf', {
        body: { caseId }
      });

      if (error) throw error;

      if (data?.success && data?.documents) {
        setDocuments(data.documents);
        setSummary(data.summary || "");
        toast({
          title: "PDF generati con successo",
          description: `Sono stati generati ${data.documents.length} documenti`,
        });
      } else {
        throw new Error(data?.error || "Errore nella generazione dei PDF");
      }
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
      {/* Generate button */}
      {documents.length === 0 && (
        <div className="flex justify-center">
          <Button
            onClick={handleGeneratePdf}
            disabled={isGenerating}
            size="lg"
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generazione PDF in corso...
              </>
            ) : (
              <>
                <FileText className="h-5 w-5" />
                Genera PDF
              </>
            )}
          </Button>
        </div>
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