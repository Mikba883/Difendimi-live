import { useMemo, useEffect, useState, useRef } from "react";
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
  const [isDownloading, setIsDownloading] = useState(false);
  const downloadLinkRef = useRef<HTMLAnchorElement | null>(null);
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    else return Math.round(bytes / 1048576) + ' MB';
  };

  // Create and memoize PDF blob
  const pdfBlob = useMemo(() => {
    try {
      // Remove any data URL prefix if present
      const base64Data = document.content.replace(/^data:application\/pdf;base64,/, '');
      
      // Validate base64 string
      if (!base64Data || base64Data.length === 0) {
        console.error('Empty PDF content');
        return null;
      }
      
      // Decode base64
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new Blob([bytes], { type: 'application/pdf' });
    } catch (error) {
      console.error('Error creating PDF blob:', error);
      toast({
        title: "Errore visualizzazione PDF",
        description: "Impossibile visualizzare il PDF. Il contenuto potrebbe essere corrotto.",
        variant: "destructive",
      });
      return null;
    }
  }, [document.content]);

  // Create and maintain blob URL
  const blobUrl = useMemo(() => {
    if (!pdfBlob) return null;
    return URL.createObjectURL(pdfBlob);
  }, [pdfBlob]);

  // Clean up blob URL when component unmounts
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  const handleOpenInNewTab = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!blobUrl) {
      toast({
        title: "Errore",
        description: "Il PDF non è ancora pronto. Riprova tra qualche secondo.",
        variant: "destructive",
      });
      return;
    }
    
    // Use window.open with the pre-created blob URL
    const newWindow = window.open(blobUrl, '_blank');
    
    if (!newWindow) {
      // Fallback: create a link and simulate click
      const link = window.document.createElement('a');
      link.href = blobUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent double download
    if (isDownloading || !pdfBlob) return;
    
    setIsDownloading(true);
    
    // Create a temporary URL for the blob
    const url = URL.createObjectURL(pdfBlob);
    
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `${document.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    link.style.display = 'none';
    
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    
    // Clean up and reset state
    setTimeout(() => {
      URL.revokeObjectURL(url);
      setIsDownloading(false);
    }, 1000);
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
            disabled={!pdfBlob}
          >
            <ExternalLink className="h-4 w-4" />
            Apri in nuova scheda
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="gap-2"
            disabled={!pdfBlob || isDownloading}
          >
            <Download className="h-4 w-4" />
            Scarica
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}