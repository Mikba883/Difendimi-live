import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, X, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PdfViewerProps {
  isOpen: boolean;
  onClose: () => void;
  pdfBlob: Blob | null;
  title: string;
}

export function PdfViewer({ isOpen, onClose, pdfBlob, title }: PdfViewerProps) {
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (pdfBlob && isOpen) {
      setIsConverting(true);
      setError(false);
      
      // Convert blob to base64 Data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setPdfDataUrl(base64data);
        setIsConverting(false);
      };
      reader.onerror = () => {
        setError(true);
        setIsConverting(false);
        toast({
          title: "Errore caricamento PDF",
          description: "Impossibile caricare il PDF. Prova a scaricarlo.",
          variant: "destructive",
        });
      };
      reader.readAsDataURL(pdfBlob);
      
      return () => {
        setPdfDataUrl(null);
      };
    }
  }, [pdfBlob, isOpen]);

  const handleDownload = () => {
    if (!pdfBlob) return;
    
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    toast({
      title: "Download avviato",
      description: "Il PDF è stato scaricato con successo",
    });
  };

  const handleOpenInNewTab = () => {
    if (!pdfDataUrl) return;
    window.open(pdfDataUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between w-full">
            <div className="flex-1">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>
                Visualizza e scarica il documento PDF
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Scarica
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 p-4 overflow-hidden">
          {isConverting ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>Preparazione PDF...</p>
            </div>
          ) : error || !pdfDataUrl ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <p className="text-muted-foreground">
                {error ? "Impossibile visualizzare il PDF nel browser." : "Nessun PDF da visualizzare"}
              </p>
              {pdfBlob && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleDownload}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Scarica PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const url = URL.createObjectURL(pdfBlob);
                      window.open(url, '_blank');
                      setTimeout(() => URL.revokeObjectURL(url), 1000);
                    }}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Apri in nuova scheda
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full relative">
              <iframe
                src={pdfDataUrl}
                className="w-full h-full border-0 rounded-lg"
                title={title}
                style={{ minHeight: '600px' }}
              />
              {/* Fallback overlay shown only if iframe fails */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/95 opacity-0 hover:opacity-100 transition-opacity">
                <p className="text-muted-foreground mb-4">Problemi di visualizzazione?</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleDownload}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Scarica
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const url = URL.createObjectURL(pdfBlob!);
                      window.open(url, '_blank');
                      setTimeout(() => URL.revokeObjectURL(url), 1000);
                    }}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Apri esternamente
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}