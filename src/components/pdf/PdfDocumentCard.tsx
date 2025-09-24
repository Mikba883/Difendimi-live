import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { PdfViewer } from "./PdfViewer";

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
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  
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

  const handleViewPdf = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!document.content) {
      toast({
        title: "Errore",
        description: "Il PDF non è ancora pronto.",
        variant: "destructive",
      });
      return;
    }
    
    setIsPdfViewerOpen(true);
  };
  
  // Create data URL for PDF viewer
  const pdfDataUrl = useMemo(() => {
    if (!document.content) return '';
    return `data:application/pdf;base64,${document.content}`;
  }, [document.content]);

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
            onClick={handleViewPdf}
            className="gap-2"
            disabled={!pdfBlob}
          >
            <Eye className="h-4 w-4" />
            Visualizza
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
      
      {/* PDF Viewer Dialog */}
      <PdfViewer
        url={pdfDataUrl}
        title={document.title}
        isOpen={isPdfViewerOpen}
        onClose={() => setIsPdfViewerOpen(false)}
      />
    </Card>
  );
}