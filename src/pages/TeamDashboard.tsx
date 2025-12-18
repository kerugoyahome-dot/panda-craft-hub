import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { FolderKanban, Calendar, Clock, LogOut, ExternalLink, Github, Upload, Timer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminDashboardSwitcher from "@/components/AdminDashboardSwitcher";
import { ProposalCreator } from "@/components/ProposalCreator";
import { FloatingChat } from "@/components/FloatingChat";
import { ProjectSubmissionDialog } from "@/components/ProjectSubmissionDialog";
import jlLogo from "@/assets/jl-logo.png";
import { Database } from "@/integrations/supabase/types";

type DepartmentType = Database["public"]["Enums"]["department_type"];

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
  deadline_hours: number | null;
  submitted_at: string | null;
}

const TeamDashboard = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [userDepartment, setUserDepartment] = useState<DepartmentType | null>(null);
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTeamProjects();
    fetchUserDepartment();
  }, [user]);

  const fetchUserDepartment = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("department_type")
      .eq("id", user.id)
      .single();
    if (data?.department_type) {
      setUserDepartment(data.department_type as DepartmentType);
    }
  };

  const fetchTeamProjects = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch projects assigned to this team member
      const { data: projectsData } = await supabase
        .from("projects")
        .select("*")
        .or(`assigned_team_id.eq.${user.id},created_by.eq.${user.id}`)
        .order("created_at", { ascending: false });

      setProjects(projectsData || []);
    } catch (error) {
      console.error("Error fetching team projects:", error);
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
          LOADING TEAM DASHBOARD...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-cyber-gray/10 to-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-xl border-b-2 border-cyber-blue/30 flex items-center justify-between px-8 z-10 shadow-[0_0_20px_rgba(0,191,255,0.2)]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center border-2 border-cyber-blue shadow-[0_0_15px_rgba(0,191,255,0.3)] overflow-hidden bg-white/10">
            <img src={jlLogo} alt="JL Software" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-orbitron text-cyber-blue-glow">
              TEAM DASHBOARD
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold font-orbitron text-cyber-blue-glow mb-2">
              ASSIGNED PROJECTS
            </h2>
            <p className="text-muted-foreground font-share-tech">
              Track your team's assigned work and deliverables
            </p>
          </div>
          <ProposalCreator />
        </div>

        {/* Projects Section */}
        <div className="mb-8">
          <h3 className="text-xl font-bold font-orbitron text-cyber-blue mb-4 flex items-center gap-2">
            <FolderKanban className="h-5 w-5" />
            ACTIVE PROJECTS ({projects.length})
          </h3>

          {projects.length === 0 ? (
            <Card className="bg-cyber-gray/50 border-2 border-cyber-blue/30">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground font-share-tech text-lg mb-2">
                  📋 No projects assigned yet
                </p>
                <p className="text-muted-foreground font-share-tech text-sm">
                  Your admin will assign work to your team soon. Check back later!
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
                            Live
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
                            Repo
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

                      {project.deadline_hours && (
                        <div className="flex items-center gap-2 text-sm">
                          <Timer className="h-4 w-4 text-yellow-400" />
                          <span className="text-muted-foreground font-share-tech">
                            Deadline: {project.deadline_hours}h
                          </span>
                        </div>
                      )}

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

                      {project.submitted_at ? (
                        <Badge className="bg-cyber-green/20 text-cyber-green border-cyber-green/50">
                          ✓ Submitted {new Date(project.submitted_at).toLocaleDateString()}
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedProject(project);
                            setSubmissionDialogOpen(true);
                          }}
                          className="w-full bg-cyber-green/20 border border-cyber-green text-cyber-green hover:bg-cyber-green/30 font-share-tech"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          SUBMIT WORK
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>


        {selectedProject && (
          <ProjectSubmissionDialog
            open={submissionDialogOpen}
            onOpenChange={setSubmissionDialogOpen}
            project={selectedProject}
            onSuccess={fetchTeamProjects}
          />
        )}
        <FloatingChat />
      </main>
    </div>
  );
};

export default TeamDashboard;
