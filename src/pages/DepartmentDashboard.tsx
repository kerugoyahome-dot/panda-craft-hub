import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderKanban, Clock, CheckCircle, AlertCircle, ArrowLeft, Users } from "lucide-react";
import { ProposalCreator } from "@/components/ProposalCreator";
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

const DepartmentDashboard = () => {
  const { department } = useParams<{ department: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currentDepartment = department as DepartmentType;

  useEffect(() => {
    if (user && currentDepartment) {
      fetchDepartmentData();
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
      case "in_progress": return "bg-cyber-blue/20 text-cyber-blue border-cyber-blue/50";
      case "review": return "bg-purple-500/20 text-purple-400 border-purple-500/50";
      case "completed": return "bg-cyber-green/20 text-cyber-green border-cyber-green/50";
      default: return "bg-muted text-muted-foreground border-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "planning": return <Clock className="w-4 h-4" />;
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-cyber-blue font-orbitron mb-2">
                  {departmentLabels[currentDepartment].toUpperCase()}
                </h1>
                <p className="text-muted-foreground font-share-tech">
                  Department Dashboard // {projects.length} Projects // {teamMembers.length} Team Members
                </p>
              </div>
              <ProposalCreator onSuccess={fetchDepartmentData} />
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-lg bg-gradient-cyber border border-cyber-blue/30">
              <div className="text-2xl font-bold text-cyber-blue font-orbitron">{projects.length}</div>
              <div className="text-sm text-muted-foreground font-share-tech">Total Projects</div>
            </div>
            <div className="p-4 rounded-lg bg-gradient-cyber border border-cyber-green/30">
              <div className="text-2xl font-bold text-cyber-green font-orbitron">
                {projects.filter(p => p.status === "completed").length}
              </div>
              <div className="text-sm text-muted-foreground font-share-tech">Completed</div>
            </div>
            <div className="p-4 rounded-lg bg-gradient-cyber border border-yellow-500/30">
              <div className="text-2xl font-bold text-yellow-400 font-orbitron">
                {projects.filter(p => p.status === "in_progress").length}
              </div>
              <div className="text-sm text-muted-foreground font-share-tech">In Progress</div>
            </div>
            <div className="p-4 rounded-lg bg-gradient-cyber border border-purple-500/30">
              <div className="text-2xl font-bold text-purple-400 font-orbitron">{teamMembers.length}</div>
              <div className="text-sm text-muted-foreground font-share-tech">Team Members</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Projects List */}
            <div className="lg:col-span-2">
              <div className="p-6 rounded-xl bg-gradient-cyber border-2 border-cyber-blue/30 shadow-cyber-glow">
                <h3 className="text-lg font-bold text-cyber-blue font-orbitron mb-4 flex items-center gap-2">
                  <FolderKanban className="w-5 h-5" />
                  DEPARTMENT PROJECTS
                </h3>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : projects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground font-share-tech">
                    No projects assigned to this department yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className="p-4 rounded-lg bg-black/50 border border-cyber-blue/20 hover:border-cyber-blue/40 transition-all cursor-pointer"
                        onClick={() => navigate(`/kanban/${project.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-white font-share-tech">{project.name}</h4>
                            {project.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {project.description}
                              </p>
                            )}
                          </div>
                          <Badge className={getStatusColor(project.status)}>
                            {getStatusIcon(project.status)}
                            <span className="ml-1">{project.status}</span>
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Progress: {project.progress}%</span>
                          {project.product_type && <span>Type: {project.product_type}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Team Members */}
            <div>
              <div className="p-6 rounded-xl bg-gradient-cyber border-2 border-cyber-green/30">
                <h3 className="text-lg font-bold text-cyber-green font-orbitron mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  TEAM MEMBERS
                </h3>
                {teamMembers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground font-share-tech">
                    No team members in this department.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-black/50 border border-cyber-green/20"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyber-blue/30 to-cyber-green/30 flex items-center justify-center text-sm font-bold border border-cyber-green text-cyber-green">
                          {member.full_name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                        </div>
                        <div>
                          <p className="font-medium text-white font-share-tech">
                            {member.full_name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">{member.department || currentDepartment}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DepartmentDashboard;
