import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between w-full">
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>
                Visualizza e scarica il documento PDF
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Scarica
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 p-4 overflow-hidden">
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border rounded-lg"
              title={title}
            />
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