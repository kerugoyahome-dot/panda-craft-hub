import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { FolderKanban, FileText, Palette, Calendar, Clock, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface Document {
  id: string;
  title: string;
  file_name: string | null;
  created_at: string;
}

interface Design {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
}

const ClientPortal = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchClientData();
  }, [user]);

  const fetchClientData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch projects where client is the creator
      const { data: projectsData } = await supabase
        .from("projects")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      // Fetch documents
      const { data: documentsData } = await supabase
        .from("documents")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      // Fetch designs
      const { data: designsData } = await supabase
        .from("designs")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setProjects(projectsData || []);
      setDocuments(documentsData || []);
      setDesigns(designsData || []);
    } catch (error) {
      console.error("Error fetching client data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "in-progress":
        return "secondary";
      case "planning":
        return "outline";
      default:
        return "outline";
    }
  };

  const getRemainingDays = (endDate: string | null) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-cyber-gray/10 to-background">
        <div className="text-cyber-blue font-share-tech text-xl animate-pulse">
          LOADING YOUR PORTAL...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-cyber-gray/10 to-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-xl border-b-2 border-cyber-blue/30 flex items-center justify-between px-8 z-10 shadow-[0_0_20px_rgba(0,191,255,0.2)]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-cyber-blue/20 to-cyber-green/20 rounded-lg flex items-center justify-center font-bold text-xl border-2 border-cyber-blue shadow-[0_0_15px_rgba(0,191,255,0.3)]">
            🐼
          </div>
          <div>
            <h1 className="text-lg font-bold font-orbitron text-cyber-blue-glow">
              CLIENT PORTAL
            </h1>
            <p className="text-xs text-cyber-green font-share-tech">
              {user?.user_metadata?.full_name || user?.email}
            </p>
          </div>
        </div>

        <Button
          onClick={signOut}
          variant="ghost"
          className="text-cyber-blue hover:bg-cyber-blue/10 font-share-tech"
        >
          <LogOut className="h-4 w-4 mr-2" />
          LOGOUT
        </Button>
      </header>

      <main className="pt-24 px-8 pb-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold font-orbitron text-cyber-blue-glow mb-2">
            WELCOME BACK, {user?.user_metadata?.full_name?.toUpperCase() || "CLIENT"}
          </h2>
          <p className="text-muted-foreground font-share-tech">
            Monitor your projects and access deliverables
          </p>
        </div>

        {/* Projects Section */}
        <div className="mb-8">
          <h3 className="text-xl font-bold font-orbitron text-cyber-blue mb-4 flex items-center gap-2">
            <FolderKanban className="h-5 w-5" />
            YOUR PROJECTS ({projects.length})
          </h3>

          {projects.length === 0 ? (
            <Card className="bg-cyber-gray/50 border-2 border-cyber-blue/30">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground font-share-tech">
                  No projects assigned yet. Contact your project manager for more information.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => {
                const remainingDays = getRemainingDays(project.end_date);
                return (
                  <Card
                    key={project.id}
                    className="bg-cyber-gray/50 border-2 border-cyber-blue/30 hover:border-cyber-blue/50 transition-all shadow-[0_0_15px_rgba(0,191,255,0.1)] hover:shadow-[0_0_25px_rgba(0,191,255,0.2)]"
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="font-orbitron text-white text-lg">
                          {project.name}
                        </CardTitle>
                        <Badge
                          variant={getStatusColor(project.status)}
                          className="font-share-tech"
                        >
                          {project.status.toUpperCase()}
                        </Badge>
                      </div>
                      {project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground font-share-tech">
                            PROGRESS
                          </span>
                          <span className="text-cyber-blue font-share-tech">
                            {project.progress}%
                          </span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>

                      {remainingDays !== null && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-cyber-green" />
                          <span className="text-muted-foreground font-share-tech">
                            {remainingDays > 0
                              ? `${remainingDays} days remaining`
                              : remainingDays === 0
                              ? "Due today"
                              : `${Math.abs(remainingDays)} days overdue`}
                          </span>
                        </div>
                      )}

                      {project.start_date && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-cyber-blue" />
                          <span className="text-muted-foreground font-share-tech">
                            Started: {new Date(project.start_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Documents & Designs Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Documents */}
          <Card className="bg-cyber-gray/50 border-2 border-cyber-blue/30 shadow-[0_0_20px_rgba(0,191,255,0.1)]">
            <CardHeader>
              <CardTitle className="font-orbitron text-cyber-blue flex items-center gap-2">
                <FileText className="h-5 w-5" />
                RECENT DOCUMENTS
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-muted-foreground font-share-tech text-center py-8">
                  No documents available
                </p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-lg bg-cyber-gray/30 border border-cyber-blue/20 hover:border-cyber-blue/40 transition-all"
                    >
                      <p className="font-medium text-white font-share-tech text-sm">
                        {doc.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Designs */}
          <Card className="bg-cyber-gray/50 border-2 border-cyber-blue/30 shadow-[0_0_20px_rgba(0,191,255,0.1)]">
            <CardHeader>
              <CardTitle className="font-orbitron text-cyber-blue flex items-center gap-2">
                <Palette className="h-5 w-5" />
                RECENT DESIGNS
              </CardTitle>
            </CardHeader>
            <CardContent>
              {designs.length === 0 ? (
                <p className="text-muted-foreground font-share-tech text-center py-8">
                  No designs available
                </p>
              ) : (
                <div className="space-y-3">
                  {designs.map((design) => (
                    <div
                      key={design.id}
                      className="p-3 rounded-lg bg-cyber-gray/30 border border-cyber-blue/20 hover:border-cyber-blue/40 transition-all"
                    >
                      <p className="font-medium text-white font-share-tech text-sm">
                        {design.title}
                      </p>
                      {design.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {design.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(design.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ClientPortal;
