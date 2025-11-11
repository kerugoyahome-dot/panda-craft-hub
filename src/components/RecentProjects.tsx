import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

const RecentProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProjects();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('projects-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'projects',
            filter: `created_by=eq.${user.id}`,
          },
          () => {
            fetchProjects();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("created_by", user?.id)
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "bg-cyber-blue/20 text-cyber-blue-glow border-cyber-blue/50 font-share-tech";
      case "review":
        return "bg-cyber-green/20 text-cyber-green-glow border-cyber-green/50 font-share-tech";
      case "planning":
        return "bg-cyber-gray text-muted-foreground border-cyber-blue/30 font-share-tech";
      case "completed":
        return "bg-cyber-green/30 text-cyber-green border-cyber-green/50 font-share-tech";
      default:
        return "bg-secondary text-foreground border-border font-share-tech";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace("_", " ").toUpperCase();
  };

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return "No deadline";
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return "Overdue";
    if (diff === 0) return "Due today";
    if (diff === 1) return "1 day";
    if (diff < 7) return `${diff} days`;
    const weeks = Math.ceil(diff / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""}`;
  };

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-cyber border-2 border-cyber-green/30">
        <div className="text-center py-8 text-cyber-green font-share-tech">
          LOADING OPERATIONS...
        </div>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card className="p-6 bg-gradient-cyber border-2 border-cyber-green/30">
        <div className="text-center py-8 text-muted-foreground font-share-tech">
          NO RECENT PROJECTS
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-cyber border-2 border-cyber-green/30 relative overflow-hidden">
      {/* Scan line effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyber-green/5 to-transparent animate-pulse" />
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h2 className="text-xl font-bold font-orbitron text-cyber-green">RECENT OPERATIONS</h2>
        <TrendingUp className="h-5 w-5 text-cyber-green" />
      </div>
      
      <div className="space-y-4 relative z-10">
        {projects.map((project, index) => (
          <div
            key={index}
            className="p-4 rounded-lg bg-cyber-gray/50 hover:bg-cyber-gray transition-all cursor-pointer border border-cyber-blue/30 hover:border-cyber-blue hover:shadow-[0_0_20px_rgba(0,191,255,0.2)]"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold mb-1 font-orbitron text-white">{project.name}</h3>
                <p className="text-sm text-cyber-blue font-share-tech">
                  {project.description ? project.description.substring(0, 50) + "..." : "No description"}
                </p>
              </div>
              <Badge className={getStatusColor(project.status)}>
                {getStatusLabel(project.status)}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-share-tech">PROGRESS</span>
                <span className="font-medium text-cyber-green font-share-tech">{project.progress}%</span>
              </div>
              <div className="w-full h-2 bg-cyber-gray rounded-full overflow-hidden border border-cyber-blue/30">
                <div
                  className="h-full bg-gradient-to-r from-cyber-blue to-cyber-green transition-all duration-300 shadow-[0_0_10px_rgba(0,191,255,0.5)]"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              <div className="flex items-center gap-1 text-sm text-cyber-green font-share-tech">
                <Clock className="h-3 w-3" />
                <span>{getDaysRemaining(project.end_date)} remaining</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default RecentProjects;
