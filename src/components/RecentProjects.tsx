import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const RecentProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProjects();
      const channel = supabase
        .channel('projects-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `created_by=eq.${user.id}` }, () => fetchProjects())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase.from("projects").select("*").eq("created_by", user?.id).order("created_at", { ascending: false }).limit(4);
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
      case "in_progress": return "bg-primary/10 text-primary border-primary/30";
      case "review": return "bg-amber-50 text-amber-700 border-amber-200";
      case "planning": return "bg-muted text-muted-foreground border-border";
      case "completed": return "bg-green-50 text-green-700 border-green-200";
      default: return "bg-secondary text-foreground border-border";
    }
  };

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return "No deadline";
    const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return "Overdue";
    if (diff === 0) return "Due today";
    if (diff === 1) return "1 day";
    if (diff < 7) return `${diff} days`;
    return `${Math.ceil(diff / 7)} weeks`;
  };

  if (loading) {
    return <Card className="p-6"><div className="text-center py-8 text-muted-foreground">Loading projects...</div></Card>;
  }
  if (projects.length === 0) {
    return <Card className="p-6"><div className="text-center py-8 text-muted-foreground">No recent projects</div></Card>;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold font-playfair text-foreground">Recent Projects</h2>
        <TrendingUp className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="space-y-4">
        {projects.map((project, index) => (
          <div key={index} className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-all cursor-pointer border border-border">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold mb-1 text-foreground">{project.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {project.description ? project.description.substring(0, 50) + "..." : "No description"}
                </p>
              </div>
              <Badge className={getStatusColor(project.status)}>
                {project.status.replace("_", " ").toUpperCase()}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-foreground">{project.progress}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-300 rounded-full" style={{ width: `${project.progress}%` }} />
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
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
