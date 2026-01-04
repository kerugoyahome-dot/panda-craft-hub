import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DocumentViewer } from "@/components/DocumentViewer";
import { WordDocumentEditor } from "@/components/WordDocumentEditor";
import { 
  FileArchive, 
  FileText, 
  Search, 
  Download, 
  Eye, 
  Edit2,
  Loader2,
  FolderOpen,
  Image as ImageIcon,
  FileSpreadsheet,
  Filter
} from "lucide-react";

interface Document {
  id: string;
  title: string;
  file_name: string | null;
  file_path: string | null;
  file_size: number | null;
  file_type: string | null;
  content: string | null;
  created_at: string;
  created_by: string;
  project_id: string | null;
  creator_name?: string;
  project_name?: string;
}

interface Design {
  id: string;
  title: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  description: string | null;
  created_at: string;
  created_by: string;
  project_id: string | null;
  creator_name?: string;
  project_name?: string;
}

export const RecordsManagementSection = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    fetchAllRecords();

    const docChannel = supabase
      .channel("records-documents")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "documents" },
        () => fetchAllRecords()
      )
      .subscribe();

    const designChannel = supabase
      .channel("records-designs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "designs" },
        () => fetchAllRecords()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(docChannel);
      supabase.removeChannel(designChannel);
    };
  }, []);

  const fetchAllRecords = async () => {
    setLoading(true);
    try {
      // Fetch all documents
      const { data: docsData, error: docsError } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (docsError) throw docsError;

      // Fetch all designs
      const { data: designsData, error: designsError } = await supabase
        .from("designs")
        .select("*")
        .order("created_at", { ascending: false });

      if (designsError) throw designsError;

      // Get creator names and project names for documents
      const docsWithDetails = await Promise.all(
        (docsData || []).map(async (doc) => {
          const [profileRes, projectRes] = await Promise.all([
            supabase.from("profiles").select("full_name").eq("id", doc.created_by).single(),
            doc.project_id 
              ? supabase.from("projects").select("name").eq("id", doc.project_id).single()
              : Promise.resolve({ data: null })
          ]);
          return {
            ...doc,
            creator_name: profileRes.data?.full_name || "Unknown",
            project_name: projectRes.data?.name || null
          };
        })
      );

      // Get creator names and project names for designs
      const designsWithDetails = await Promise.all(
        (designsData || []).map(async (design) => {
          const [profileRes, projectRes] = await Promise.all([
            supabase.from("profiles").select("full_name").eq("id", design.created_by).single(),
            design.project_id 
              ? supabase.from("projects").select("name").eq("id", design.project_id).single()
              : Promise.resolve({ data: null })
          ]);
          return {
            ...design,
            creator_name: profileRes.data?.full_name || "Unknown",
            project_name: projectRes.data?.name || null
          };
        })
      );

      setDocuments(docsWithDetails);
      setDesigns(designsWithDetails);
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <FileText className="h-5 w-5" />;
    if (fileType.startsWith("image/")) return <ImageIcon className="h-5 w-5" />;
    if (fileType.includes("spreadsheet") || fileType.includes("excel")) return <FileSpreadsheet className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  const handleViewDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setViewerOpen(true);
  };

  const handleEditDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setEditorOpen(true);
  };

  const isDocxOrText = (doc: Document) => {
    const fileType = doc.file_type || "";
    const fileName = doc.file_name || "";
    return fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
           fileName.endsWith(".docx") ||
           fileType.startsWith("text/") ||
           fileName.endsWith(".txt") ||
           fileName.endsWith(".md") ||
           doc.content;
  };

  const handleDownload = async (filePath: string, fileName: string, bucket: string) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(filePath);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = fileName;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.creator_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDesigns = designs.filter(design =>
    design.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    design.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    design.creator_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRecords = documents.length + designs.length;

  if (loading) {
    return (
      <Card className="bg-gradient-cyber border-2 border-cyan-500/30">
        <CardContent className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gradient-cyber border-2 border-cyan-500/30 shadow-cyber-glow">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-xl font-orbitron text-cyan-400 flex items-center gap-2">
              <FileArchive className="h-6 w-6" />
              RECORDS MANAGEMENT SYSTEM
            </CardTitle>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-cyan-400 border-cyan-500/50">
                {totalRecords} Total Records
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-cyber-gray border-cyan-500/30"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="documents" className="w-full">
            <TabsList className="bg-black/50 border border-cyan-500/30 mb-4">
              <TabsTrigger value="documents" className="data-[state=active]:bg-cyan-500/20">
                <FileText className="h-4 w-4 mr-2" />
                Documents ({filteredDocuments.length})
              </TabsTrigger>
              <TabsTrigger value="designs" className="data-[state=active]:bg-cyan-500/20">
                <ImageIcon className="h-4 w-4 mr-2" />
                Designs ({filteredDesigns.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="documents">
              <ScrollArea className="h-[400px]">
                {filteredDocuments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-share-tech">No documents found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-black/50 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors"
                      >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                            {getFileIcon(doc.file_type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-white font-share-tech truncate">
                              {doc.title}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                              <span>{doc.creator_name}</span>
                              <span>•</span>
                              <span>{formatDate(doc.created_at)}</span>
                              <span>•</span>
                              <span>{formatFileSize(doc.file_size)}</span>
                              {doc.project_name && (
                                <>
                                  <span>•</span>
                                  <Badge variant="outline" className="text-xs">
                                    {doc.project_name}
                                  </Badge>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDocument(doc)}
                            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {isDocxOrText(doc) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditDocument(doc)}
                              className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                          {doc.file_path && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownload(doc.file_path!, doc.file_name || "document", "documents")}
                              className="text-cyber-green hover:text-cyber-green hover:bg-cyber-green/20"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="designs">
              <ScrollArea className="h-[400px]">
                {filteredDesigns.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-share-tech">No designs found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredDesigns.map((design) => {
                      const { data } = supabase.storage
                        .from("designs")
                        .getPublicUrl(design.file_path);
                      
                      return (
                        <div
                          key={design.id}
                          className="p-4 rounded-lg bg-black/50 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors"
                        >
                          <div className="aspect-video rounded-lg overflow-hidden mb-3 bg-black/50">
                            <img
                              src={data?.publicUrl}
                              alt={design.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder.svg";
                              }}
                            />
                          </div>
                          <p className="font-medium text-white font-share-tech truncate mb-1">
                            {design.title}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                              {design.creator_name} • {formatDate(design.created_at)}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownload(design.file_path, design.file_name, "designs")}
                              className="text-cyber-green hover:bg-cyber-green/20"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <DocumentViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        document={selectedDocument}
      />
      
      <WordDocumentEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        document={selectedDocument}
        onSave={fetchAllRecords}
      />
    </>
  );
};
