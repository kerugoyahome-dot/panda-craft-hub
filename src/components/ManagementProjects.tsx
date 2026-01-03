import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FolderKanban, 
  Search, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Target,
  Users,
  Calendar,
  ExternalLink,
  Filter
} from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"];
type DepartmentType = Database["public"]["Enums"]["department_type"];

const departmentLabels: Record<DepartmentType, string> = {
  financial: "Financial",
  graphic_design: "Graphic Design",
  developers: "Developers",
  advertising: "Advertising",
  compliance: "Compliance",
  management: "Management",
  records_management: "Records Management",
};

export const ManagementProjects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<(Project & { client_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  useEffect(() => {
    fetchAllProjects();

    const channel = supabase
      .channel("management-projects")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => fetchAllProjects()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAllProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get client names
      const projectsWithClients = await Promise.all(
        (data || []).map(async (project) => {
          if (project.client_id) {
            const { data: client } = await supabase
              .from("clients")
              .select("name")
              .eq("id", project.client_id)
              .single();
            return { ...project, client_name: client?.name };
          }
          return project;
        })
      );

      setProjects(projectsWithClients);
    } catch (error) {
      console.error("Error fetching projects:", error);
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

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesDepartment = departmentFilter === "all" || project.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const stats = {
    total: projects.length,
    completed: projects.filter(p => p.status === "completed").length,
    inProgress: projects.filter(p => p.status === "in-progress" || p.status === "in_progress").length,
    planning: projects.filter(p => p.status === "planning").length,
  };

  if (loading) {
    return (
      <Card className="bg-gradient-cyber border-2 border-orange-500/30">
        <CardContent className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 text-orange-400 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-cyber border-2 border-orange-500/30 shadow-cyber-glow">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="text-xl font-orbitron text-orange-400 flex items-center gap-2">
            <FolderKanban className="h-6 w-6" />
            ALL PROJECTS OVERVIEW
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-cyber-green border-cyber-green/50">
              {stats.completed} Completed
            </Badge>
            <Badge variant="outline" className="text-cyber-blue border-cyber-blue/50">
              {stats.inProgress} In Progress
            </Badge>
            <Badge variant="outline" className="text-yellow-400 border-yellow-500/50">
              {stats.planning} Planning
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mt-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-cyber-gray border-orange-500/30"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-cyber-gray border-orange-500/30">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-cyber-gray border-orange-500/30">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
            </SelectContent>
          </Select>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[180px] bg-cyber-gray border-orange-500/30">
              <Users className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent className="bg-cyber-gray border-orange-500/30">
              <SelectItem value="all">All Departments</SelectItem>
              {Object.entries(departmentLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[500px]">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-share-tech">No projects found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="p-4 rounded-lg bg-black/50 border border-orange-500/20 hover:border-orange-500/40 transition-all cursor-pointer group"
                  onClick={() => navigate(`/kanban/${project.id}`)}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-white font-share-tech truncate group-hover:text-orange-400 transition-colors">
                          {project.name}
                        </h4>
                        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <Badge className={`${getStatusColor(project.status)} shrink-0`}>
                      {getStatusIcon(project.status)}
                      <span className="ml-1 capitalize">{project.status.replace("-", " ")}</span>
                    </Badge>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span className="text-orange-400">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    {project.department && (
                      <Badge variant="outline" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {departmentLabels[project.department as DepartmentType] || project.department}
                      </Badge>
                    )}
                    {project.client_name && (
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {project.client_name}
                      </span>
                    )}
                    {project.product_type && (
                      <span className="flex items-center gap-1">
                        <FolderKanban className="w-3 h-3" />
                        {project.product_type}
                      </span>
                    )}
                    {project.deadline_hours && (
                      <span className="flex items-center gap-1 text-yellow-400">
                        <Clock className="w-3 h-3" />
                        {project.deadline_hours}h deadline
                      </span>
                    )}
                    {project.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(project.start_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
