import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PdfDocument {
  id: string;
  title: string;
  rationale: string;
  url?: string;
  content?: string;  // Base64 content
  size_bytes: number;
}

interface PdfDocumentCardProps {
  document: PdfDocument;
}

export function PdfDocumentCard({ document }: PdfDocumentCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    else return Math.round(bytes / 1048576) + ' MB';
  };

  const handleDownload = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (isDownloading) return;
    
    setIsDownloading(true);
    
    try {
      // Priorità al contenuto base64 per bypassare il blocco di Chrome
      if (document.content) {
        // Estrai il contenuto base64 dal data URL
        const base64Data = document.content.split(',')[1] || document.content;
        
        // Converti base64 in blob con gestione errori migliorata
        let blob: Blob;
        try {
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          blob = new Blob([bytes], { type: 'application/pdf' });
        } catch (decodeError) {
          console.error('Errore decodifica base64:', decodeError);
          throw new Error('Impossibile decodificare il PDF');
        }
        
        // Crea URL temporaneo e scarica immediatamente
        const url = URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = `${document.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        // Rimuovo target="_blank" perché non serve per il download
        link.style.display = 'none';
        
        window.document.body.appendChild(link);
        link.click();
        
        // Pulizia con timeout più lungo per assicurare il download
        setTimeout(() => {
          window.document.body.removeChild(link);
          URL.revokeObjectURL(url);
          setIsDownloading(false);
          
          toast({
            title: "Download completato",
            description: "Il PDF è stato scaricato con successo",
          });
        }, 2000);
        
      } else if (document.url) {
        // Fallback all'URL se non c'è base64
        const link = window.document.createElement('a');
        link.href = document.url;
        link.download = `${document.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        // Rimuovo target="_blank" anche qui
        link.style.display = 'none';
        
        window.document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          window.document.body.removeChild(link);
          setIsDownloading(false);
          
          toast({
            title: "Download avviato",
            description: "Il PDF è in download...",
          });
        }, 2000);
        
      } else {
        throw new Error("Nessun contenuto disponibile");
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Errore nel download",
        description: error instanceof Error ? error.message : "Si è verificato un errore durante il download del PDF",
        variant: "destructive",
      });
      setIsDownloading(false);
    }
  };

  const handleView = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (isViewing) return;
    
    setIsViewing(true);
    
    try {
      // Priorità al contenuto base64
      if (document.content) {
        // Estrai il contenuto base64 dal data URL
        const base64Data = document.content.split(',')[1] || document.content;
        
        // Converti base64 in blob con gestione errori
        let blob: Blob;
        try {
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          blob = new Blob([bytes], { type: 'application/pdf' });
        } catch (decodeError) {
          console.error('Errore decodifica base64:', decodeError);
          throw new Error('Impossibile decodificare il PDF');
        }
        
        // Crea URL temporaneo e apri in nuova scheda
        const url = URL.createObjectURL(blob);
        const newWindow = window.open(url, '_blank');
        
        // NON rilasciare l'URL troppo presto - lasciamo più tempo
        setTimeout(() => {
          setIsViewing(false);
        }, 500);
        
        // Rilascia l'URL solo dopo molto tempo per assicurarsi che la scheda sia caricata
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 30000); // 30 secondi
        
        if (!newWindow) {
          toast({
            title: "Popup bloccato",
            description: "Abilita i popup per visualizzare il PDF",
            variant: "destructive",
          });
        }
      } else if (document.url) {
        // Fallback all'URL se non c'è base64
        window.open(document.url, '_blank');
        setTimeout(() => {
          setIsViewing(false);
        }, 500);
      } else {
        throw new Error("Nessun contenuto disponibile per la visualizzazione");
      }
    } catch (error) {
      console.error('Error viewing PDF:', error);
      toast({
        title: "Errore nella visualizzazione",
        description: error instanceof Error ? error.message : "Non è possibile visualizzare il PDF al momento",
        variant: "destructive",
      });
      setIsViewing(false);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">{document.title}</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {formatFileSize(document.size_bytes)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {document.rationale}
        </p>
        
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleDownload}
            className="gap-2 flex-1"
            disabled={isDownloading}
          >
            <Download className="h-4 w-4" />
            {isDownloading ? "Download..." : "Scarica PDF"}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleView}
            className="gap-2 flex-1"
            disabled={isViewing}
          >
            <Eye className="h-4 w-4" />
            {isViewing ? "Apertura..." : "Visualizza PDF"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}