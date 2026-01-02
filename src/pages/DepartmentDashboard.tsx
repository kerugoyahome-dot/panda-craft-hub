import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  FolderKanban, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  Users, 
  TrendingUp,
  Target,
  Briefcase,
  Upload,
  Image as ImageIcon
} from "lucide-react";
import { ProposalCreator } from "@/components/ProposalCreator";
import { FloatingChat } from "@/components/FloatingChat";
import { FinancialTransactions } from "@/components/FinancialTransactions";
import { DepartmentProposals } from "@/components/DepartmentProposals";
import { DepartmentActivity } from "@/components/DepartmentActivity";
import { DepartmentDocuments } from "@/components/DepartmentDocuments";
import { PresenceIndicator } from "@/components/PresenceIndicator";
import { usePresence } from "@/hooks/usePresence";
import { UploadDesignDialog } from "@/components/UploadDesignDialog";
import { DesignGallery } from "@/components/DesignGallery";
import { DevHubSection } from "@/components/DevHubSection";
import { Database } from "@/integrations/supabase/types";

type DepartmentType = Database["public"]["Enums"]["department_type"];
type Project = Database["public"]["Tables"]["projects"]["Row"];

const departmentLabels: Record<DepartmentType, string> = {
  financial: "Financial",
  graphic_design: "Graphic Design",
  developers: "Developers",
  advertising: "Advertising",
  compliance: "Compliance",
  management: "Management",
};

const departmentDescriptions: Record<DepartmentType, string> = {
  financial: "Budget management, invoicing, financial reports, and revenue tracking",
  graphic_design: "Visual design, branding, creative assets, and design deliverables",
  developers: "Software development, web applications, and technical implementation",
  advertising: "Marketing campaigns, promotions, and client outreach",
  compliance: "Legal compliance, audits, and regulatory requirements",
  management: "Operations, strategy, team coordination, and project oversight",
};

const DepartmentDashboard = () => {
  const { department } = useParams<{ department: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { isOnline } = usePresence();
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDesignOpen, setUploadDesignOpen] = useState(false);

  const currentDepartment = department as DepartmentType;

  useEffect(() => {
    if (user && currentDepartment) {
      fetchDepartmentData();

      // Real-time subscription for projects
      const projectChannel = supabase
        .channel(`dept-projects-${currentDepartment}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "projects",
            filter: `department=eq.${currentDepartment}`,
          },
          () => fetchDepartmentData()
        )
        .subscribe();

      // Real-time subscription for team members
      const memberChannel = supabase
        .channel(`dept-members-${currentDepartment}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "profiles",
          },
          () => fetchDepartmentData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(projectChannel);
        supabase.removeChannel(memberChannel);
      };
    }
  }, [user, currentDepartment]);

  const fetchDepartmentData = async () => {
    setLoading(true);
    try {
      // Fetch projects for this department
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("department", currentDepartment)
        .order("created_at", { ascending: false });

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      // Fetch team members in this department
      const { data: membersData, error: membersError } = await supabase
        .from("profiles")
        .select("*")
        .eq("department_type", currentDepartment);

      if (membersError) throw membersError;
      setTeamMembers(membersData || []);
    } catch (error) {
      console.error("Error fetching department data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "in-progress":
      case "in_progress": return "bg-cyber-blue/20 text-cyber-blue border-cyber-blue/50";
      case "review": return "bg-purple-500/20 text-purple-400 border-purple-500/50";
      case "completed": return "bg-cyber-green/20 text-cyber-green border-cyber-green/50";
      case "submitted": return "bg-cyan-500/20 text-cyan-400 border-cyan-500/50";
      default: return "bg-muted text-muted-foreground border-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "planning": return <Clock className="w-4 h-4" />;
      case "in-progress":
      case "in_progress": return <AlertCircle className="w-4 h-4" />;
      case "completed": return <CheckCircle className="w-4 h-4" />;
      default: return <FolderKanban className="w-4 h-4" />;
    }
  };

  if (!currentDepartment || !departmentLabels[currentDepartment]) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-cyber-blue font-orbitron text-2xl mb-4">Invalid Department</h1>
          <Button onClick={() => navigate("/departments")} className="bg-cyber-blue text-black">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const completedProjects = projects.filter(p => p.status === "completed").length;
  const inProgressProjects = projects.filter(p => p.status === "in-progress" || p.status === "in_progress").length;
  const avgProgress = projects.length > 0 
    ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length) 
    : 0;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(0,191,255,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,191,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,191,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      
      <Navigation />
      <Header />
      
      <main className="ml-20 pt-16 p-8 animate-fade-in relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/departments")}
              className="mb-4 text-cyber-blue hover:text-cyber-blue-glow"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Departments
            </Button>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl font-bold text-cyber-blue font-orbitron mb-2">
                  {departmentLabels[currentDepartment].toUpperCase()}
                </h1>
                <p className="text-muted-foreground font-share-tech max-w-2xl">
                  {departmentDescriptions[currentDepartment]}
                </p>
              </div>
              <div className="flex gap-2">
                {currentDepartment === "graphic_design" && (
                  <Button
                    onClick={() => setUploadDesignOpen(true)}
                    className="bg-cyber-green/20 border-2 border-cyber-green text-cyber-green hover:bg-cyber-green/30 font-share-tech"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    UPLOAD DESIGN
                  </Button>
                )}
                <ProposalCreator onSuccess={fetchDepartmentData} />
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card className="bg-gradient-cyber border-2 border-cyber-blue/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyber-blue/20">
                    <FolderKanban className="h-5 w-5 text-cyber-blue" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-cyber-blue font-orbitron">{projects.length}</div>
                    <div className="text-xs text-muted-foreground font-share-tech">Total Projects</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-cyber border-2 border-cyber-green/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyber-green/20">
                    <CheckCircle className="h-5 w-5 text-cyber-green" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-cyber-green font-orbitron">{completedProjects}</div>
                    <div className="text-xs text-muted-foreground font-share-tech">Completed</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-cyber border-2 border-yellow-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-400 font-orbitron">{inProgressProjects}</div>
                    <div className="text-xs text-muted-foreground font-share-tech">In Progress</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-cyber border-2 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Users className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-400 font-orbitron">{teamMembers.length}</div>
                    <div className="text-xs text-muted-foreground font-share-tech">Team Members</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-cyber border-2 border-cyan-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <TrendingUp className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-cyan-400 font-orbitron">{avgProgress}%</div>
                    <div className="text-xs text-muted-foreground font-share-tech">Avg Progress</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Projects List - Takes 2 columns */}
            <div className="lg:col-span-2">
              <Card className="bg-gradient-cyber border-2 border-cyber-blue/30 shadow-cyber-glow h-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-bold text-cyber-blue font-orbitron flex items-center gap-2">
                    <FolderKanban className="w-5 h-5" />
                    DEPARTMENT PROJECTS
                  </CardTitle>
                  <Badge variant="outline" className="text-cyber-blue border-cyber-blue/50">
                    {projects.length} projects
                  </Badge>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                  ) : projects.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground font-share-tech">
                      <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      No projects assigned to this department yet.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {projects.map((project) => (
                        <div
                          key={project.id}
                          className="p-4 rounded-lg bg-black/50 border border-cyber-blue/20 hover:border-cyber-blue/40 transition-all cursor-pointer group"
                          onClick={() => navigate(`/kanban/${project.id}`)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-white font-share-tech truncate group-hover:text-cyber-blue transition-colors">
                                {project.name}
                              </h4>
                              {project.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {project.description}
                                </p>
                              )}
                            </div>
                            <Badge className={`${getStatusColor(project.status)} ml-2 shrink-0`}>
                              {getStatusIcon(project.status)}
                              <span className="ml-1 capitalize">{project.status.replace("-", " ")}</span>
                            </Badge>
                          </div>
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                              <span>Progress</span>
                              <span>{project.progress}%</span>
                            </div>
                            <Progress value={project.progress} className="h-2" />
                          </div>
                          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                            {project.product_type && (
                              <span className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                {project.product_type}
                              </span>
                            )}
                            {project.deadline_hours && (
                              <span className="flex items-center gap-1 text-yellow-400">
                                <Clock className="w-3 h-3" />
                                {project.deadline_hours}h deadline
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Team Members */}
            <div>
              <Card className="bg-gradient-cyber border-2 border-cyber-green/30 h-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-bold text-cyber-green font-orbitron flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    TEAM MEMBERS
                  </CardTitle>
                  <Badge variant="outline" className="text-cyber-green border-cyber-green/50">
                    {teamMembers.filter(m => isOnline(m.id)).length} online
                  </Badge>
                </CardHeader>
                <CardContent>
                  {teamMembers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground font-share-tech">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      No team members assigned to this department yet.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                      {teamMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-black/50 border border-cyber-green/20 hover:border-cyber-green/40 transition-colors"
                        >
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyber-blue/30 to-cyber-green/30 flex items-center justify-center text-sm font-bold border border-cyber-green text-cyber-green">
                              {member.full_name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                            </div>
                            <div className="absolute -bottom-1 -right-1">
                              <PresenceIndicator isOnline={isOnline(member.id)} size="sm" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white font-share-tech truncate">
                              {member.full_name || "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {departmentLabels[currentDepartment]}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Secondary Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Proposals */}
            <DepartmentProposals department={currentDepartment} />
            
            {/* Activity Feed */}
            <DepartmentActivity department={currentDepartment} />
            
            {/* Documents */}
            <DepartmentDocuments department={currentDepartment} />
          </div>

          {/* Financial Transactions for Financial Department */}
          {currentDepartment === "financial" && (
            <div className="mb-8">
              <FinancialTransactions />
            </div>
          )}

          {/* Design Gallery for Graphic Design Department */}
          {currentDepartment === "graphic_design" && (
            <div className="mb-8">
              <DesignGallery />
            </div>
          )}

          {/* DevHub for Developers Department */}
          {currentDepartment === "developers" && (
            <div className="mb-8">
              <DevHubSection />
            </div>
          )}
        </div>
      </main>
      <FloatingChat />
      
      {/* Upload Design Dialog */}
      <UploadDesignDialog
        open={uploadDesignOpen}
        onOpenChange={setUploadDesignOpen}
      />
    </div>
  );
};

export default DepartmentDashboard;
