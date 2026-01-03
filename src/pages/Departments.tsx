import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  Palette, 
  Code2, 
  Megaphone, 
  Shield, 
  Building2,
  ArrowRight,
  FileArchive
} from "lucide-react";

const departments = [
  {
    id: "financial",
    name: "Financial",
    description: "Budget management, invoicing, and financial reports",
    icon: DollarSign,
    color: "cyber-green",
    borderColor: "border-cyber-green/50",
    bgColor: "bg-cyber-green/10",
  },
  {
    id: "graphic_design",
    name: "Graphic Design",
    description: "Visual design, branding, and creative assets",
    icon: Palette,
    color: "cyber-blue",
    borderColor: "border-cyber-blue/50",
    bgColor: "bg-cyber-blue/10",
  },
  {
    id: "developers",
    name: "Developers",
    description: "Software development, coding, and technical implementation",
    icon: Code2,
    color: "purple-400",
    borderColor: "border-purple-500/50",
    bgColor: "bg-purple-500/10",
  },
  {
    id: "advertising",
    name: "Advertising",
    description: "Marketing campaigns, promotions, and outreach",
    icon: Megaphone,
    color: "yellow-400",
    borderColor: "border-yellow-500/50",
    bgColor: "bg-yellow-500/10",
  },
  {
    id: "compliance",
    name: "Compliance",
    description: "Legal compliance, audits, and regulatory requirements",
    icon: Shield,
    color: "red-400",
    borderColor: "border-red-500/50",
    bgColor: "bg-red-500/10",
  },
  {
    id: "management",
    name: "Management",
    description: "Operations, strategy, and team coordination",
    icon: Building2,
    color: "orange-400",
    borderColor: "border-orange-500/50",
    bgColor: "bg-orange-500/10",
  },
  {
    id: "records_management",
    name: "Records Management",
    description: "Document management, file archiving, and organizational records",
    icon: FileArchive,
    color: "cyan-400",
    borderColor: "border-cyan-500/50",
    bgColor: "bg-cyan-500/10",
  },
];

const Departments = () => {
  const navigate = useNavigate();

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
            <div className="flex items-center gap-4 mb-4">
              <div className="h-1 w-12 bg-gradient-to-r from-cyber-blue to-cyber-green" />
              <span className="text-cyber-green font-share-tech text-sm tracking-wider">
                ▸ DEPARTMENT MANAGEMENT
              </span>
            </div>
            <h1 className="text-4xl font-bold text-cyber-blue font-orbitron mb-2">
              DEPARTMENTS
            </h1>
            <p className="text-muted-foreground font-share-tech">
              Select a department to view projects, team members, and proposals
            </p>
          </div>

          {/* Department Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept) => {
              const Icon = dept.icon;
              return (
                <div
                  key={dept.id}
                  className={`p-6 rounded-xl bg-gradient-cyber border-2 ${dept.borderColor} hover:shadow-cyber-glow transition-all duration-300 cursor-pointer group`}
                  onClick={() => navigate(`/departments/${dept.id}`)}
                >
                  <div className={`w-14 h-14 rounded-lg ${dept.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-7 h-7 text-${dept.color}`} />
                  </div>
                  <h3 className={`text-xl font-bold text-${dept.color} font-orbitron mb-2`}>
                    {dept.name.toUpperCase()}
                  </h3>
                  <p className="text-muted-foreground text-sm font-share-tech mb-4">
                    {dept.description}
                  </p>
                  <Button
                    variant="ghost"
                    className={`w-full justify-between text-${dept.color} hover:bg-${dept.color}/10 border ${dept.borderColor}`}
                  >
                    <span className="font-share-tech">VIEW DASHBOARD</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Departments;
