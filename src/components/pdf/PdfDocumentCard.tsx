import { useMemo, useState } from "react";
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
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    else return Math.round(bytes / 1048576) + ' MB';
  };

  // Create and memoize PDF blob with improved validation
  const pdfBlob = useMemo(() => {
    try {
      // Remove any data URL prefix and clean whitespace
      const cleanContent = document.content
        .replace(/^data:application\/pdf;base64,/, '')
        .replace(/[\s\n\r]/g, '');
      
      // Validate base64 string
      if (!cleanContent || cleanContent.length === 0) {
        console.error('Empty PDF content');
        return null;
      }
      
      // Check for valid base64 format
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanContent)) {
        console.error('Invalid base64 format');
        return null;
      }
      
      // Decode base64
      const binaryString = atob(cleanContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Validate PDF magic number (%PDF)
      if (bytes.length > 4) {
        const isPDF = bytes[0] === 0x25 && bytes[1] === 0x50 && 
                     bytes[2] === 0x44 && bytes[3] === 0x46;
        if (!isPDF) {
          console.warn('File does not appear to be a valid PDF');
        }
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

  const handleOpenPdf = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!pdfBlob) {
      console.error('PDF blob is not available');
      toast({
        title: "PDF non disponibile",
        description: "Il contenuto del PDF non è ancora pronto",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Create blob URL for opening in new tab
      const blobUrl = URL.createObjectURL(pdfBlob);
      console.log('Opening PDF with URL:', blobUrl);
      
      // Try to open in new tab
      const newWindow = window.open(blobUrl, '_blank');
      
      if (!newWindow) {
        // Popup was blocked, show message instead of auto-clicking
        toast({
          title: "Popup bloccato", 
          description: "Usa il pulsante 'Scarica' per salvare il PDF",
        });
        // Clean up immediately if popup was blocked
        URL.revokeObjectURL(blobUrl);
      } else {
        // Clean up blob URL after a delay if opened successfully
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      }
    } catch (error) {
      console.error('Error opening PDF:', error);
      toast({
        title: "Errore apertura PDF",
        description: "Impossibile aprire il PDF. Prova a scaricarlo.",
        variant: "destructive",
      });
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
            variant="outline"
            size="sm"
            onClick={handleOpenPdf}
            className="gap-2"
            disabled={!pdfBlob}
          >
            <ExternalLink className="h-4 w-4" />
            Apri PDF
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={handleDownload}
            className="gap-2"
            disabled={!pdfBlob || isDownloading}
          >
            <Download className="h-4 w-4" />
            {isDownloading ? "Download..." : "Scarica"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}