import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  History,
  RotateCcw,
  Clock,
  User,
  FileText,
  Loader2,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  title: string;
  content: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
  created_by: string;
  change_description: string | null;
  creator_name?: string;
}

interface Document {
  id: string;
  title: string;
  content: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
}

interface DocumentVersionControlProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document | null;
  onRevert?: () => void;
}

export const DocumentVersionControl = ({
  open,
  onOpenChange,
  document,
  onRevert,
}: DocumentVersionControlProps) => {
  const { user } = useAuth();
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [reverting, setReverting] = useState(false);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open && document) {
      fetchVersions();
    }
  }, [open, document]);

  const fetchVersions = async () => {
    if (!document) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("document_versions")
        .select("*")
        .eq("document_id", document.id)
        .order("version_number", { ascending: false });

      if (error) throw error;

      // Get creator names
      const versionsWithNames = await Promise.all(
        (data || []).map(async (version) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", version.created_by)
            .single();
          return {
            ...version,
            creator_name: profile?.full_name || "Unknown",
          };
        })
      );

      setVersions(versionsWithNames);
    } catch (error) {
      console.error("Error fetching versions:", error);
      toast.error("Failed to fetch document versions");
    } finally {
      setLoading(false);
    }
  };

  const handleRevert = async (version: DocumentVersion) => {
    if (!document || !user) return;
    setReverting(true);
    try {
      // Save current version before reverting
      const currentVersionNumber = versions.length > 0 ? versions[0].version_number + 1 : 1;
      
      // Create a backup of current state
      const { error: backupError } = await supabase.from("document_versions").insert({
        document_id: document.id,
        version_number: currentVersionNumber,
        title: document.title,
        content: document.content,
        file_path: document.file_path,
        file_name: document.file_name,
        file_size: document.file_size,
        file_type: document.file_type,
        created_by: user.id,
        change_description: `Backup before reverting to version ${version.version_number}`,
      });

      if (backupError) throw backupError;

      // Revert the document to selected version
      const { error: updateError } = await supabase
        .from("documents")
        .update({
          title: version.title,
          content: version.content,
          file_path: version.file_path,
          file_name: version.file_name,
          file_size: version.file_size,
          file_type: version.file_type,
          updated_at: new Date().toISOString(),
        })
        .eq("id", document.id);

      if (updateError) throw updateError;

      toast.success(`Reverted to version ${version.version_number}`);
      onRevert?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error reverting:", error);
      toast.error("Failed to revert document");
    } finally {
      setReverting(false);
    }
  };

  const toggleExpanded = (versionId: string) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(versionId)) {
      newExpanded.delete(versionId);
    } else {
      newExpanded.add(versionId);
    }
    setExpandedVersions(newExpanded);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-cyber-gray border-2 border-cyan-500/50">
        <DialogHeader>
          <DialogTitle className="text-cyan-400 font-orbitron flex items-center gap-2">
            <History className="h-5 w-5" />
            VERSION HISTORY
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Document: <span className="text-white">{document?.title}</span>
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-share-tech">No version history available</p>
            <p className="text-sm mt-2">
              Versions are created when you edit and save documents
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    index === 0
                      ? "bg-cyan-500/10 border-cyan-500/40"
                      : "bg-black/50 border-cyan-500/20 hover:border-cyan-500/40"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className={`${
                            index === 0
                              ? "text-cyan-400 border-cyan-500/50"
                              : "text-muted-foreground"
                          }`}
                        >
                          v{version.version_number}
                        </Badge>
                        {index === 0 && (
                          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
                            Current
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-medium text-white font-share-tech">
                        {version.title}
                      </h4>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {version.creator_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(version.created_at)}
                        </span>
                        {version.file_size && (
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {formatFileSize(version.file_size)}
                          </span>
                        )}
                      </div>
                      {version.change_description && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          "{version.change_description}"
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {version.content && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleExpanded(version.id)}
                          className="text-cyan-400 hover:bg-cyan-500/20"
                        >
                          {expandedVersions.has(version.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {index > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRevert(version)}
                          disabled={reverting}
                          className="text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/20"
                        >
                          {reverting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Revert
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expanded content preview */}
                  {expandedVersions.has(version.id) && version.content && (
                    <div className="mt-4 p-3 rounded-lg bg-black/50 border border-cyan-500/20">
                      <p className="text-xs text-muted-foreground mb-2">Content Preview:</p>
                      <pre className="text-sm text-white whitespace-pre-wrap font-share-tech max-h-[200px] overflow-y-auto">
                        {version.content.substring(0, 1000)}
                        {version.content.length > 1000 && "..."}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Helper function to save a document version
export const saveDocumentVersion = async (
  documentId: string,
  title: string,
  content: string | null,
  filePath: string | null,
  fileName: string | null,
  fileSize: number | null,
  fileType: string | null,
  userId: string,
  changeDescription?: string
) => {
  try {
    // Get the latest version number
    const { data: latestVersion, error: fetchError } = await supabase
      .from("document_versions")
      .select("version_number")
      .eq("document_id", documentId)
      .order("version_number", { ascending: false })
      .limit(1)
      .single();

    const newVersionNumber = latestVersion ? latestVersion.version_number + 1 : 1;

    const { error } = await supabase.from("document_versions").insert({
      document_id: documentId,
      version_number: newVersionNumber,
      title,
      content,
      file_path: filePath,
      file_name: fileName,
      file_size: fileSize,
      file_type: fileType,
      created_by: userId,
      change_description: changeDescription || `Version ${newVersionNumber}`,
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error saving document version:", error);
    return false;
  }
};
