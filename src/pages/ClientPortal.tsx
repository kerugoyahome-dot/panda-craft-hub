import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { FolderKanban, FileText, Palette, Calendar, Clock, LogOut, ExternalLink, Github } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminDashboardSwitcher from "@/components/AdminDashboardSwitcher";
import ClientMessaging from "@/components/ClientMessaging";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  start_date: string | null;
  end_date: string | null;
  product_type: string;
  live_url: string | null;
  repository_url: string | null;
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
  const [clientId, setClientId] = useState<string | null>(null);
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchClientData();

    // Set up real-time subscriptions
    const projectsChannel = supabase
      .channel('client-projects')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects'
        },
        () => {
          fetchClientData();
        }
      )
      .subscribe();

    const documentsChannel = supabase
      .channel('client-documents')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents'
        },
        () => {
          fetchClientData();
        }
      )
      .subscribe();

    const designsChannel = supabase
      .channel('client-designs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'designs'
        },
        () => {
          fetchClientData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(projectsChannel);
      supabase.removeChannel(documentsChannel);
      supabase.removeChannel(designsChannel);
    };
  }, [user]);

  const fetchClientData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch client record linked to the current user
      const { data: clientData } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!clientData) {
        setProjects([]);
        setDocuments([]);
        setDesigns([]);
        setClientId(null);
        setLoading(false);
        return;
      }

      setClientId(clientData.id);

      // Fetch projects assigned to this client
      const { data: projectsData } = await supabase
        .from("projects")
        .select("*")
        .eq("client_id", clientData.id)
        .order("created_at", { ascending: false });

      // Fetch documents for client's projects
      const projectIds = projectsData?.map(p => p.id) || [];
      const { data: documentsData } = await supabase
        .from("documents")
        .select("*")
        .in("project_id", projectIds.length > 0 ? projectIds : [''])
        .order("created_at", { ascending: false })
        .limit(10);

      // Fetch designs for client's projects
      const { data: designsData } = await supabase
        .from("designs")
        .select("*")
        .in("project_id", projectIds.length > 0 ? projectIds : [''])
        .order("created_at", { ascending: false })
        .limit(10);

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

  const getProductTypeIcon = (type: string) => {
    return type === "web" ? "🌐" : type === "design" ? "🎨" : type === "software" ? "💻" : "📱";
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

        <div className="flex items-center gap-3">
          {isAdmin && <AdminDashboardSwitcher />}
          
          <Button
            onClick={signOut}
            variant="ghost"
            className="text-cyber-blue hover:bg-cyber-blue/10 font-share-tech"
          >
            <LogOut className="h-4 w-4 mr-2" />
            LOGOUT
          </Button>
        </div>
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
                <p className="text-muted-foreground font-share-tech text-lg mb-2">
                  📋 No projects assigned yet
                </p>
                <p className="text-muted-foreground font-share-tech text-sm">
                  Your admin will assign projects to you soon. Check back later!
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
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {getProductTypeIcon(project.product_type)}
                          </span>
                          <CardTitle className="font-orbitron text-white text-lg">
                            {project.name}
                          </CardTitle>
                        </div>
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
                      <div className="flex gap-2 mt-2">
                        {project.live_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-cyber-green hover:text-cyber-green hover:bg-cyber-green/10"
                            onClick={() => window.open(project.live_url!, "_blank")}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Live Preview
                          </Button>
                        )}
                        {project.repository_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-cyber-blue hover:text-cyber-blue hover:bg-cyber-blue/10"
                            onClick={() => window.open(project.repository_url!, "_blank")}
                          >
                            <Github className="h-3 w-3 mr-1" />
                            Repository
                          </Button>
                        )}
                      </div>
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

        {/* Messaging Section */}
        {clientId && (
          <div className="mb-8">
            <ClientMessaging clientId={clientId} />
          </div>
        )}

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
