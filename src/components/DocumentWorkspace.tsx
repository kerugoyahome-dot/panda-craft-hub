import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentViewer } from "@/components/DocumentViewer";
import { WordDocumentEditor } from "@/components/WordDocumentEditor";
import { AIWriterDialog } from "@/components/AIWriterDialog";
import { toast } from "sonner";
import {
  Plus, FileText, Upload, Download, Eye, Edit2, Trash2,
  Sparkles, Search, File, Loader2
} from "lucide-react";

interface DocumentWorkspaceProps {
  department?: string;
  compact?: boolean;
}

interface DocItem {
  id: string;
  title: string;
  content: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
  created_by: string;
  project_id: string | null;
}

export const DocumentWorkspace = ({ department, compact = false }: DocumentWorkspaceProps) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<DocItem | null>(null);
  const [editDoc, setEditDoc] = useState<DocItem | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: "", content: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setDocuments(data || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newDoc.title.trim() || !user) return;
    setUploading(true);

    let filePath = null, fileName = null, fileSize = null, fileType = null;

    if (selectedFile) {
      const ext = selectedFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("documents").upload(path, selectedFile);
      if (error) {
        toast.error("File upload failed");
        setUploading(false);
        return;
      }
      filePath = path;
      fileName = selectedFile.name;
      fileSize = selectedFile.size;
      fileType = selectedFile.type;
    }

    const { error } = await supabase.from("documents").insert([{
      title: newDoc.title,
      content: newDoc.content || null,
      created_by: user.id,
      file_path: filePath,
      file_name: fileName,
      file_size: fileSize,
      file_type: fileType,
    }]);

    if (error) {
      toast.error("Failed to create document");
    } else {
      toast.success("Document created");
      setNewDoc({ title: "", content: "" });
      setSelectedFile(null);
      setCreateOpen(false);
      fetchDocuments();
    }
    setUploading(false);
  };

  const handleDelete = async (doc: DocItem) => {
    if (!confirm("Delete this document?")) return;
    if (doc.file_path) {
      await supabase.storage.from("documents").remove([doc.file_path]);
    }
    const { error } = await supabase.from("documents").delete().eq("id", doc.id);
    if (!error) {
      toast.success("Deleted");
      fetchDocuments();
    }
  };

  const handleDownload = async (doc: DocItem) => {
    if (!doc.file_path) return;
    const { data, error } = await supabase.storage.from("documents").download(doc.file_path);
    if (error) { toast.error("Download failed"); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url; a.download = doc.file_name || "document";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleAIInsert = (content: string) => {
    setNewDoc(prev => ({ ...prev, content: prev.content ? prev.content + "\n\n" + content : content }));
    setCreateOpen(true);
  };

  const isPdf = (type: string | null) => type === "application/pdf";
  const isWord = (type: string | null) => type?.includes("word") || type?.includes("docx");

  const filtered = documents.filter(d =>
    d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.file_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "-";
    return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <>
      <Card className="bg-card/50 border-2 border-primary/30">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg font-orbitron text-primary flex items-center gap-2">
            <FileText className="h-5 w-5" />
            DOCUMENTS {department && `- ${department.toUpperCase()}`}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setAiOpen(true)}>
              <Sparkles className="h-4 w-4 mr-1" /> AI Writer
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No documents found</p>
            </div>
          ) : (
            <ScrollArea className={compact ? "max-h-[300px]" : "max-h-[500px]"}>
              <div className="space-y-2">
                {filtered.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-primary/10 hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <File className="h-5 w-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{doc.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {doc.file_name && <span>{doc.file_name}</span>}
                          {doc.file_size && <span>{formatSize(doc.file_size)}</span>}
                          {doc.file_type && (
                            <Badge variant="secondary" className="text-xs">
                              {isPdf(doc.file_type) ? "PDF" : isWord(doc.file_type) ? "DOCX" : doc.file_type.split("/").pop()}
                            </Badge>
                          )}
                          {!doc.file_type && doc.content && (
                            <Badge variant="secondary" className="text-xs">Text</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => setViewDoc(doc)} title="View">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {(isWord(doc.file_type) || doc.content) && (
                        <Button variant="ghost" size="icon" onClick={() => setEditDoc(doc)} title="Edit">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      {doc.file_path && (
                        <Button variant="ghost" size="icon" onClick={() => handleDownload(doc)} title="Download">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(doc)} title="Delete" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Create Document Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={newDoc.title} onChange={(e) => setNewDoc(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Content</Label>
                <Button variant="ghost" size="sm" onClick={() => setAiOpen(true)}>
                  <Sparkles className="h-3 w-3 mr-1" /> AI Assist
                </Button>
              </div>
              <Textarea
                value={newDoc.content}
                onChange={(e) => setNewDoc(p => ({ ...p, content: e.target.value }))}
                rows={8}
                placeholder="Write content or use AI to generate..."
              />
            </div>
            <div>
              <Label>Upload File (PDF, DOCX, etc.)</Label>
              <Input type="file" accept=".pdf,.doc,.docx,.txt,.md" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={uploading || !newDoc.title.trim()}>
                {uploading ? "Uploading..." : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Viewer */}
      <DocumentViewer open={!!viewDoc} onOpenChange={() => setViewDoc(null)} document={viewDoc} />

      {/* Word Editor */}
      {editDoc && (
        <WordDocumentEditor
          open={!!editDoc}
          onOpenChange={() => setEditDoc(null)}
          document={editDoc}
          onSave={() => { setEditDoc(null); fetchDocuments(); }}
        />
      )}

      {/* AI Writer */}
      <AIWriterDialog open={aiOpen} onOpenChange={setAiOpen} onInsert={handleAIInsert} />
    </>
  );
};
