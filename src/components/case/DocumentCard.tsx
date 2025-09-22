import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Eye, FileText } from "lucide-react";
import { useState } from "react";
import { PdfViewer } from "@/components/pdf/PdfViewer";
import type { Document } from "@/types/case";

interface DocumentCardProps {
  document: Document;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const [showPreview, setShowPreview] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-lg">{document.title}</CardTitle>
                <CardDescription className="text-sm mt-1">
                  {formatFileSize(document.size_bytes)}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {document.rationale}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(true)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              Anteprima
            </Button>
            <Button
              variant="default"
              size="sm"
              asChild
              className="flex-1"
            >
              <a href={document.signed_url} download>
                <Download className="h-4 w-4 mr-2" />
                Scarica
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <PdfViewer
        url={document.signed_url}
        title={document.title}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </>
  );
}