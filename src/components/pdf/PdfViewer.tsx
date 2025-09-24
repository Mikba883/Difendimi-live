import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set worker URL for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PdfViewerProps {
  isOpen: boolean;
  onClose: () => void;
  pdfBlob: Blob | null;
  title: string;
  onDownload: () => void;
}

export function PdfViewer({ isOpen, onClose, pdfBlob, title, onDownload }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [pdfFile, setPdfFile] = useState<string | null>(null);

  // Convert blob to data URL when modal opens
  useEffect(() => {
    if (pdfBlob && isOpen) {
      console.log('Converting blob to data URL, blob size:', pdfBlob.size);
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('Data URL created successfully');
        setPdfFile(reader.result as string);
      };
      reader.onerror = (error) => {
        console.error('Error reading blob:', error);
      };
      reader.readAsDataURL(pdfBlob);
    } else {
      setPdfFile(null);
    }
  }, [pdfBlob, isOpen]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error("PDF load error:", error);
    toast({
      title: "Errore caricamento PDF",
      description: "Impossibile caricare il documento PDF",
      variant: "destructive",
    });
  };

  const changePage = (offset: number) => {
    setPageNumber(prevPage => {
      const newPage = prevPage + offset;
      if (numPages) {
        if (newPage < 1) return 1;
        if (newPage > numPages) return numPages;
      }
      return newPage;
    });
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">{title}</DialogTitle>
            <div className="flex items-center gap-2">
              {/* Page navigation */}
              <div className="flex items-center gap-1 text-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => changePage(-1)}
                  disabled={pageNumber <= 1}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2">
                  {pageNumber} / {numPages || '?'}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => changePage(1)}
                  disabled={!numPages || pageNumber >= numPages}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Zoom controls */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomOut}
                  className="h-8 w-8"
                  title="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomIn}
                  className="h-8 w-8"
                  title="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>

              {/* Rotate button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRotate}
                className="h-8 w-8"
                title="Ruota"
              >
                <RotateCw className="h-4 w-4" />
              </Button>

              {/* Download button */}
              <Button
                variant="default"
                size="sm"
                onClick={onDownload}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Scarica
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* PDF Document */}
        <div className="flex-1 overflow-auto bg-muted/20 flex justify-center items-start p-4">
          {pdfFile && (
            <Document
              file={pdfFile}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center h-full">
                  <div className="text-muted-foreground">Caricamento PDF...</div>
                </div>
              }
              error={
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <p className="text-muted-foreground">Errore nel caricamento del PDF</p>
                  <Button variant="outline" onClick={onDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Scarica invece
                  </Button>
                </div>
              }
              noData={
                <div className="text-muted-foreground">Nessun dato PDF disponibile</div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                rotate={rotation}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-lg"
              />
            </Document>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}