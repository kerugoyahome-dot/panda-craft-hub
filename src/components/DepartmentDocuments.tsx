import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Plus, Loader2 } from "lucide-react";
import { CreateDocumentDialog } from "@/components/CreateDocumentDialog";
import { Database } from "@/integrations/supabase/types";

type DepartmentType = Database["public"]["Enums"]["department_type"];

interface Document {
  id: string;
  title: string;
  file_name: string | null;
  file_path: string | null;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
  created_by: string;
  creator_name?: string;
}

interface DepartmentDocumentsProps {
  department: DepartmentType;
}

const departmentLabels: Record<DepartmentType, string> = {
  financial: "Financial",
  graphic_design: "Graphic Design",
  developers: "Developers",
  advertising: "Advertising",
  compliance: "Compliance",
  management: "Management",
};

export const DepartmentDocuments = ({ department }: DepartmentDocumentsProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchDocuments();

    const channel = supabase
      .channel(`department-documents-${department}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "documents",
        },
        () => fetchDocuments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [department]);

  const fetchDocuments = async () => {
    try {
      // Get team members in this department
      const { data: members } = await supabase
        .from("profiles")
        .select("id")
        .eq("department_type", department);

      if (!members || members.length === 0) {
        setDocuments([]);
        setLoading(false);
        return;
      }

      const memberIds = members.map((m) => m.id);

      // Get documents created by department members
      const { data: docData, error } = await supabase
        .from("documents")
        .select("*")
        .in("created_by", memberIds)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Get creator names
      const docsWithNames = await Promise.all(
        (docData || []).map(async (doc) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", doc.created_by)
            .single();
          return { ...doc, creator_name: profile?.full_name || "Unknown" };
        })
      );

      setDocuments(docsWithNames);
    } catch (error) {
      console.error("Error fetching documents:", error);
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

  if (loading) {
    return (
      <Card className="bg-cyber-gray/50 border-2 border-cyan-500/30">
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 text-cyan-400 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-cyber-gray/50 border-2 border-cyan-500/30">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-orbitron text-cyan-400 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            DOCUMENTS
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/30"
          >
            <Plus className="h-4 w-4 mr-1" />
            ADD
          </Button>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-center text-muted-foreground font-share-tech py-4">
              No documents yet
            </p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-cyan-500/10">
                      <FileText className="h-4 w-4 text-cyan-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white font-share-tech truncate">
                        {doc.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {doc.creator_name} • {formatFileSize(doc.file_size)}
                      </p>
                    </div>
                  </div>
                  {doc.file_path && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-cyan-400 hover:text-cyan-300"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <CreateDocumentDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        onSuccess={fetchDocuments}
      />
    </>
  );
};
