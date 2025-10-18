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
        return "bg-cyber-blue/20 text-cyber-blue-glow border-cyber-blue/50 font-share-tech";
      case "Review":
        return "bg-cyber-green/20 text-cyber-green-glow border-cyber-green/50 font-share-tech";
      case "Planning":
        return "bg-cyber-gray text-muted-foreground border-cyber-blue/30 font-share-tech";
      default:
        return "bg-secondary text-foreground border-border font-share-tech";
    }
  };

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
                <p className="text-sm text-cyber-blue font-share-tech">{project.client}</p>
              </div>
              <Badge className={getStatusColor(project.status)}>
                {project.status}
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
