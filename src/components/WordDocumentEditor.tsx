import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  Download, 
  Save,
  Edit2,
  Eye,
  Loader2,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import mammoth from "mammoth";

interface WordDocumentEditorProps {
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
  onSave?: (content: string) => void;
}

export const WordDocumentEditor = ({ open, onOpenChange, document, onSave }: WordDocumentEditorProps) => {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && document) {
      loadDocument();
    }
  }, [open, document]);

  const loadDocument = async () => {
    if (!document) return;

    setLoading(true);
    try {
      // If it's a stored document with content
      if (document.content) {
        setContent(document.content);
        setHtmlContent(`<div style="white-space: pre-wrap;">${document.content}</div>`);
        setLoading(false);
        return;
      }

      // If it's a file
      if (document.file_path) {
        const isDocx = document.file_type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                       document.file_name?.endsWith(".docx");

        if (isDocx) {
          // Download and parse DOCX
          const { data, error } = await supabase.storage
            .from("documents")
            .download(document.file_path);

          if (error) throw error;

          const arrayBuffer = await data.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setHtmlContent(result.value);
          
          // Also extract raw text for editing
          const textResult = await mammoth.extractRawText({ arrayBuffer });
          setContent(textResult.value);
        } else if (document.file_type?.startsWith("text/")) {
          // Plain text file
          const { data, error } = await supabase.storage
            .from("documents")
            .download(document.file_path);

          if (error) throw error;

          const text = await data.text();
          setContent(text);
          setHtmlContent(`<div style="white-space: pre-wrap;">${text}</div>`);
        } else {
          setContent("");
          setHtmlContent("<p>This document type cannot be displayed inline.</p>");
        }
      }
    } catch (error) {
      console.error("Error loading document:", error);
      toast.error("Failed to load document");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!document) return;

    setSaving(true);
    try {
      // Update the document content in database
      const { error } = await supabase
        .from("documents")
        .update({ content })
        .eq("id", document.id);

      if (error) throw error;

      toast.success("Document saved successfully!");
      onSave?.(content);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error("Failed to save document");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!document?.file_path) return;
    
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
      toast.error("Failed to download document");
    } finally {
      setLoading(false);
    }
  };

  const handleExportAsText = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${document?.title || "document"}.txt`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Document exported as text file");
  };

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] bg-cyber-gray border-2 border-cyber-blue/50">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-cyber-blue font-orbitron flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {document.title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="border-cyber-blue/50 text-cyber-blue hover:bg-cyber-blue/20"
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    className="border-muted-foreground"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="border-cyber-green/50 text-cyber-green hover:bg-cyber-green/20"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                    Save
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportAsText}
                className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
              >
                <Download className="h-4 w-4 mr-1" />
                Export TXT
              </Button>
              {document.file_path && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={loading}
                  className="border-cyber-green/50 text-cyber-green hover:bg-cyber-green/20"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Original
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-cyber-blue" />
            </div>
          ) : isEditing ? (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[60vh] bg-black/50 border-cyber-blue/30 text-white font-mono resize-none"
              placeholder="Enter document content..."
            />
          ) : (
            <div className="p-4">
              {htmlContent ? (
                <div
                  ref={contentRef}
                  className="prose prose-invert max-w-none bg-white/5 rounded-lg p-6 border border-cyber-blue/30"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                  style={{
                    color: "white",
                    lineHeight: 1.8,
                  }}
                />
              ) : content ? (
                <div className="bg-black/50 rounded-lg p-4 border border-cyber-blue/30">
                  <pre className="whitespace-pre-wrap text-sm text-white font-share-tech">
                    {content}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>No content available to display</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};