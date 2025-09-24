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
  url?: string;
  content?: string;  // Supporta entrambi per retrocompatibilità
  size_bytes: number;
}

interface PdfDocumentCardProps {
  document: PdfDocument;
}

export function PdfDocumentCard({ document }: PdfDocumentCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    else return Math.round(bytes / 1048576) + ' MB';
  };

  const handleOpenPdf = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!document.url && !document.content) {
      toast({
        title: "PDF non disponibile",
        description: "Il PDF non è ancora pronto",
        variant: "destructive",
      });
      return;
    }
    setShowPdfViewer(true);
  };

  const handleDownload = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (isDownloading) return;
    
    setIsDownloading(true);
    
    // Se abbiamo un URL, lo usiamo direttamente
    if (document.url) {
      window.open(document.url, '_blank');
      setTimeout(() => {
        setIsDownloading(false);
      }, 1000);
    } else if (document.content) {
      // Fallback per base64 content
      try {
        const cleanContent = document.content
          .replace(/^data:application\/pdf;base64,/, '')
          .replace(/[\s\n\r]/g, '');
        const binaryString = atob(cleanContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const link = window.document.createElement('a');
        link.href = url;
        link.download = `${document.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        link.style.display = 'none';
        
        window.document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          window.document.body.removeChild(link);
          URL.revokeObjectURL(url);
          setIsDownloading(false);
        }, 100);
      } catch (error) {
        console.error('Error downloading PDF:', error);
        toast({
          title: "Errore nel download",
          description: "Si è verificato un errore durante il download del PDF",
          variant: "destructive",
        });
        setIsDownloading(false);
        return;
      }
    }
    
    toast({
      title: "Download avviato",
      description: "Il PDF è in download...",
    });
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
          >
            <Eye className="h-4 w-4" />
            Visualizza PDF
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={handleDownload}
            className="gap-2"
            disabled={isDownloading}
          >
            <Download className="h-4 w-4" />
            {isDownloading ? "Download..." : "Scarica"}
          </Button>
        </div>
      </CardContent>
      
      {/* PDF Viewer Modal */}
      <PdfViewer
        isOpen={showPdfViewer}
        onClose={() => setShowPdfViewer(false)}
        pdfUrl={document.url}
        title={document.title}
        onDownload={handleDownload}
      />
    </Card>
  );
}