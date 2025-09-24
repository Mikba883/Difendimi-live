import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PdfDocument {
  id: string;
  title: string;
  rationale: string;
  content: string;
  size_bytes: number;
}

interface PdfDocumentCardProps {
  document: PdfDocument;
}

export function PdfDocumentCard({ document }: PdfDocumentCardProps) {

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    else return Math.round(bytes / 1048576) + ' MB';
  };

  // Memoize PDF URL to avoid recreating it on each render
  const pdfUrl = useMemo(() => {
    try {
      // Remove any data URL prefix if present
      const base64Data = document.content.replace(/^data:application\/pdf;base64,/, '');
      
      // Validate base64 string
      if (!base64Data || base64Data.length === 0) {
        console.error('Empty PDF content');
        return '';
      }
      
      // Decode base64
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error creating PDF URL:', error);
      toast({
        title: "Errore visualizzazione PDF",
        description: "Impossibile visualizzare il PDF. Il contenuto potrebbe essere corrotto.",
        variant: "destructive",
      });
      return '';
    }
  }, [document.content]);

  const handleOpenInNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const handleDownload = () => {
    if (pdfUrl) {
      const a = window.document.createElement('a');
      a.href = pdfUrl;
      a.download = `${document.id}.pdf`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
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
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleOpenInNewTab}
            className="gap-2"
            disabled={!pdfUrl}
          >
            <ExternalLink className="h-4 w-4" />
            Apri in nuova scheda
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="gap-2"
            disabled={!pdfUrl}
          >
            <Download className="h-4 w-4" />
            Scarica
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}