import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";

interface PdfViewerProps {
  url: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PdfViewer({ url, title, isOpen, onClose }: PdfViewerProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a href={url} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Apri in nuova scheda
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a href={url} download>
                  <Download className="h-4 w-4 mr-2" />
                  Scarica
                </a>
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 h-full">
          <object 
            data={url} 
            type="application/pdf" 
            width="100%" 
            height="100%"
            className="rounded-lg"
          >
            <iframe 
              src={url} 
              width="100%" 
              height="100%"
              className="rounded-lg"
              title={title}
            />
          </object>
        </div>
      </DialogContent>
    </Dialog>
  );
}