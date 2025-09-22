import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, FileText, AlertCircle } from "lucide-react";
import { CaseStatusBadge } from "@/components/case/CaseStatusBadge";
import { ReportTabs } from "@/components/case/ReportTabs";
import { DocumentCard } from "@/components/case/DocumentCard";
import type { Case } from "@/types/case";

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCase();
  }, [id]);

  const loadCase = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('cases')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      
      if (!data) {
        setError('Caso non trovato');
        return;
      }

      setCaseData(data as any);
    } catch (err) {
      console.error('Error loading case:', err);
      setError('Errore nel caricamento del caso');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Caricamento caso...</p>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Caso non trovato'}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => navigate('/dashboard')}
            className="mt-4 w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-xl font-semibold">
                {caseData.title || `Caso ${caseData.job_id || caseData.id}`}
              </h1>
              <CaseStatusBadge status={caseData.status} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Error Message */}
          {caseData.error_message && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {caseData.error_message}
              </AlertDescription>
            </Alert>
          )}

          {/* Case Info */}
          {(caseData.case_type || caseData.jurisdiction || caseData.area_of_law) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {caseData.case_type && (
                <div className="bg-card rounded-lg p-4 border">
                  <p className="text-sm text-muted-foreground">Tipo di Caso</p>
                  <p className="text-lg font-medium mt-1">{caseData.case_type}</p>
                </div>
              )}
              {caseData.jurisdiction && (
                <div className="bg-card rounded-lg p-4 border">
                  <p className="text-sm text-muted-foreground">Giurisdizione</p>
                  <p className="text-lg font-medium mt-1">{caseData.jurisdiction}</p>
                </div>
              )}
              {caseData.area_of_law?.length > 0 && (
                <div className="bg-card rounded-lg p-4 border">
                  <p className="text-sm text-muted-foreground">Area Legale</p>
                  <p className="text-lg font-medium mt-1">{caseData.area_of_law.join(', ')}</p>
                </div>
              )}
            </div>
          )}

          {/* Report Tabs */}
          {caseData.report && (
            <div>
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Report Legale
              </h2>
              <ReportTabs report={caseData.report} />
            </div>
          )}

          {/* Documents */}
          {caseData.documents?.items?.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Documenti Generati
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {caseData.documents.items.map((doc) => (
                  <DocumentCard key={doc.id} document={doc} />
                ))}
              </div>
            </div>
          )}

          {/* No content message */}
          {!caseData.report && (!caseData.documents?.items?.length) && caseData.status !== 'error' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {caseData.status === 'processing' 
                  ? 'Il caso è ancora in elaborazione. Ricarica la pagina tra qualche minuto.'
                  : caseData.status === 'queued'
                  ? 'Il caso è in coda per l\'elaborazione.'
                  : 'Nessun contenuto disponibile per questo caso.'}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </main>
    </div>
  );
}