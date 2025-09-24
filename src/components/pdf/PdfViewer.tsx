import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PdfViewerProps {
  isOpen: boolean;
  onClose: () => void;
  pdfBlob: Blob | null;
  title: string;
}

export function PdfViewer({ isOpen, onClose, pdfBlob, title }: PdfViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (pdfBlob && isOpen) {
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
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
    if (!pdfUrl) return;
    window.open(pdfUrl, '_blank');
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
          {pdfUrl ? (
            <>
              <object
                data={pdfUrl}
                type="application/pdf"
                className="w-full h-full border rounded-lg"
                title={title}
              >
                <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                  <p>Il browser non può visualizzare il PDF direttamente.</p>
                  <Button
                    variant="outline"
                    onClick={handleOpenInNewTab}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Apri in nuova scheda
                  </Button>
                </div>
              </object>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Caricamento PDF...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}