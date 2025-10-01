import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { CaseStatusBadge } from "@/components/case/CaseStatusBadge";
import { ReportSections } from "@/components/case/ReportSections";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import { useMetaPixel } from "@/hooks/useMetaPixel";
import type { Case } from "@/types/case";

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isPremium } = usePremiumStatus();
  const { trackEvent } = useMetaPixel();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasTrackedCaseView, setHasTrackedCaseView] = useState(false);

  useEffect(() => {
    loadCase();
  }, [id]);

  // Auto-redirect to premium after 20 seconds for non-premium users
  useEffect(() => {
    // Save last viewed case
    if (id) {
      localStorage.setItem('lastViewedCase', id);
    }
    if (!isPremium && caseData?.report) {
      // Check if we've already redirected for this case
      const redirectedCases = JSON.parse(localStorage.getItem('redirectedCases') || '[]');
      
      if (!redirectedCases.includes(caseData.id)) {
        const timer = setTimeout(() => {
          // Mark this case as redirected
          redirectedCases.push(caseData.id);
          localStorage.setItem('redirectedCases', JSON.stringify(redirectedCases));
          navigate('/premium', { state: { fromCase: `/case/${caseData.id}` } });
        }, 20000);

        return () => clearTimeout(timer);
      }
    }
  }, [isPremium, caseData, navigate]);

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
      
      // Track ViewCase event once when case is loaded
      if (!hasTrackedCaseView && data) {
        trackEvent('ViewCase', {
          custom_data: {
            case_id: data.id,
            case_status: data.status,
            case_type: data.case_type || 'general',
            has_report: !!data.report
          }
        });
        setHasTrackedCaseView(true);
      }
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
          {/* Mobile header - 2 rows */}
          <div className="md:hidden space-y-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>
              <CaseStatusBadge status={caseData.status} />
            </div>
            <h1 className="text-xl font-bold">
              {caseData.title || `Caso ${caseData.job_id || caseData.id}`}
            </h1>
          </div>

          {/* Desktop header - 1 row */}
          <div className="hidden md:flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Button>
            
            <h1 className="text-2xl font-bold flex-1 text-center">
              {caseData.title || `Caso ${caseData.job_id || caseData.id}`}
            </h1>
            
            <CaseStatusBadge status={caseData.status} />
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

          {/* Case Info Card */}
          {(caseData.case_type || caseData.jurisdiction || caseData.area_of_law) && (
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {caseData.case_type && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Tipologia Caso</p>
                      <p className="font-medium">{caseData.case_type}</p>
                    </div>
                  )}
                  {caseData.jurisdiction && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Giurisdizione</p>
                      <p className="font-medium">{caseData.jurisdiction}</p>
                    </div>
                  )}
                  {caseData.area_of_law?.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Area Legale</p>
                      <p className="font-medium">{caseData.area_of_law.join(', ')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Report Sections with integrated PDF generation */}
          {caseData.report && (
            <ReportSections 
              report={caseData.report} 
              caseId={caseData.id}
              caseStatus={caseData.status}
            />
          )}

          {/* No content message */}
          {!caseData.report && caseData.status !== 'error' && (
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