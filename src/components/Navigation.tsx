import { LayoutDashboard, Users, FolderKanban, Palette, FileText, Code2, BarChart3, Settings } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: Users, label: "Clients", path: "/clients" },
    { icon: FolderKanban, label: "Projects", path: "/projects" },
    { icon: Palette, label: "Design", path: "/designs" },
    { icon: FileText, label: "Documents", path: "/documents" },
    { icon: Code2, label: "Dev Hub", path: "/dev-hub" },
    { icon: BarChart3, label: "Analytics", path: "#" },
    { icon: Settings, label: "Settings", path: "#" },
  ];

  return (
    <nav className="fixed left-0 top-0 h-screen w-20 bg-black border-r-2 border-cyber-blue/30 flex flex-col items-center py-6 gap-4 shadow-[0_0_30px_rgba(0,191,255,0.2)]">
      <div className="mb-8 relative group">
        {/* Holographic glow for logo */}
        <div className="absolute inset-0 rounded-xl bg-cyber-blue opacity-20 blur-lg group-hover:opacity-40 transition-opacity" />
        <div className="relative w-12 h-12 bg-gradient-to-br from-cyber-blue/20 to-cyber-green/20 rounded-xl flex items-center justify-center font-bold text-2xl border-2 border-cyber-blue shadow-[0_0_20px_rgba(0,191,255,0.4)]">
          🐼
        </div>
      </div>
      
      {navItems.map((item, index) => {
        const isActive = 
          location.pathname === item.path || 
          (location.pathname.startsWith('/kanban') && item.path === '/projects') ||
          (location.pathname === '/documents' && item.path === '/documents') ||
          (location.pathname === '/designs' && item.path === '/designs') ||
          (location.pathname === '/dev-hub' && item.path === '/dev-hub');
        return (
          <Button
            key={index}
            variant={isActive ? "default" : "ghost"}
            size="icon"
            className={`w-12 h-12 transition-all duration-300 font-orbitron ${
              isActive 
                ? "bg-cyber-blue/30 text-cyber-blue-glow border-2 border-cyber-blue shadow-[0_0_20px_rgba(0,191,255,0.5)] hover:bg-cyber-blue/40" 
                : "text-muted-foreground hover:text-cyber-blue hover:bg-cyber-gray hover:shadow-[0_0_15px_rgba(0,191,255,0.2)]"
            }`}
            title={item.label}
            onClick={() => item.path !== "#" && navigate(item.path)}
          >
            <item.icon className="h-5 w-5" />
          </Button>
        );
      })}
    </nav>
  );
};

export default Navigation;
