import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp } from "lucide-react";

const RecentProjects = () => {
  const projects = [
    {
      name: "E-commerce Platform Redesign",
      client: "TechCorp Ltd",
      status: "In Progress",
      progress: 65,
      deadline: "2 days",
    },
    {
      name: "Mobile App Development",
      client: "StartupX",
      status: "Review",
      progress: 90,
      deadline: "5 days",
    },
    {
      name: "Brand Identity Package",
      client: "Fashion Brand Co",
      status: "In Progress",
      progress: 45,
      deadline: "1 week",
    },
    {
      name: "Corporate Website",
      client: "Finance Group",
      status: "Planning",
      progress: 20,
      deadline: "2 weeks",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-gold/20 text-gold border-gold/30";
      case "Review":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "Planning":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-secondary text-foreground border-border";
    }
  };

  return (
    <Card className="p-6 bg-gradient-card border-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Recent Projects</h2>
        <TrendingUp className="h-5 w-5 text-gold" />
      </div>
      
      <div className="space-y-4">
        {projects.map((project, index) => (
          <div
            key={index}
            className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer border border-transparent hover:border-gold/30"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{project.name}</h3>
                <p className="text-sm text-muted-foreground">{project.client}</p>
              </div>
              <Badge className={getStatusColor(project.status)}>
                {project.status}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-gold transition-all duration-300"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{project.deadline} remaining</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default RecentProjects;
