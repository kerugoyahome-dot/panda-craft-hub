import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Download, 
  X, 
  ExternalLink,
  FileImage,
  File
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DocumentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    id: string;
    title: string;
    file_name?: string | null;
    file_path?: string | null;
    file_type?: string | null;
    content?: string | null;
  } | null;
}

export const DocumentViewer = ({ open, onOpenChange, document }: DocumentViewerProps) => {
  const [loading, setLoading] = useState(false);

  if (!document) return null;

  const isImage = document.file_type?.startsWith("image/");
  const isPdf = document.file_type === "application/pdf";
  const isText = document.file_type?.startsWith("text/") || document.content;

  const getFileUrl = () => {
    if (!document.file_path) return null;
    const { data } = supabase.storage
      .from("documents")
      .getPublicUrl(document.file_path);
    return data?.publicUrl;
  };

  const handleDownload = async () => {
    if (!document.file_path) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(document.file_path);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = document.file_name || "document";
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenExternal = () => {
    const url = getFileUrl();
    if (url) {
      window.open(url, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-cyber-gray border-2 border-cyber-blue/50">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-cyber-blue font-orbitron flex items-center gap-2">
              {isImage ? <FileImage className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
              {document.title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {document.file_path && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenExternal}
                    className="border-cyber-blue/50 text-cyber-blue hover:bg-cyber-blue/20"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    disabled={loading}
                    className="border-cyber-green/50 text-cyber-green hover:bg-cyber-green/20"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="p-4">
            {isImage && document.file_path && (
              <div className="flex justify-center">
                <img
                  src={getFileUrl() || ""}
                  alt={document.title}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg border border-cyber-blue/30"
                />
              </div>
            )}

            {isPdf && document.file_path && (
              <div className="w-full h-[60vh] rounded-lg overflow-hidden border border-cyber-blue/30">
                <iframe
                  src={`${getFileUrl()}#toolbar=0`}
                  className="w-full h-full"
                  title={document.title}
                />
              </div>
            )}

            {isText && document.content && (
              <div className="bg-black/50 rounded-lg p-4 border border-cyber-blue/30">
                <pre className="whitespace-pre-wrap text-sm text-white font-share-tech">
                  {document.content}
                </pre>
              </div>
            )}

            {!isImage && !isPdf && !isText && document.file_path && (
              <div className="text-center py-12">
                <File className="h-16 w-16 text-cyber-blue/50 mx-auto mb-4" />
                <p className="text-muted-foreground font-share-tech mb-4">
                  This file type cannot be previewed directly.
                </p>
                <Button
                  onClick={handleDownload}
                  disabled={loading}
                  className="bg-cyber-blue/20 border border-cyber-blue text-cyber-blue hover:bg-cyber-blue/30"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download to View
                </Button>
              </div>
            )}

            {!document.file_path && !document.content && (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground font-share-tech">
                  No content available for this document.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
