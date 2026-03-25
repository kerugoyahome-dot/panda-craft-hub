import { LayoutDashboard, Users, FolderKanban, Palette, FileText, Code2, BarChart3, Settings, UserCog, Building2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import abancoolLogo from "@/assets/abancool-logo.png";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: Users, label: "Clients", path: "/clients" },
    { icon: UserCog, label: "Team", path: "/team" },
    { icon: FolderKanban, label: "Projects", path: "/projects" },
    { icon: Palette, label: "Design", path: "/designs" },
    { icon: FileText, label: "Documents", path: "/documents" },
    { icon: Code2, label: "Dev Hub", path: "/dev-hub" },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
    ...(isAdmin ? [{ icon: Building2, label: "Departments", path: "/departments" }] : []),
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <nav className="fixed left-0 top-0 h-screen w-20 bg-card border-r border-border flex flex-col items-center py-6 gap-2 shadow-md z-20">
      <div className="mb-6 cursor-pointer" onClick={() => navigate("/")}>
        <div className="w-14 h-14 rounded-xl flex items-center justify-center border border-border overflow-hidden bg-white shadow-sm">
          <img src={abancoolLogo} alt="Abancool Techs" className="w-full h-full object-contain" />
        </div>
      </div>
      
      {navItems.map((item, index) => {
        const isActive = 
          location.pathname === item.path || 
          (location.pathname.startsWith('/kanban') && item.path === '/projects') ||
          (location.pathname === '/documents' && item.path === '/documents') ||
          (location.pathname === '/designs' && item.path === '/designs') ||
          (location.pathname === '/dev-hub' && item.path === '/dev-hub') ||
          (location.pathname === '/analytics' && item.path === '/analytics') ||
          (location.pathname === '/settings' && item.path === '/settings');
        return (
          <Button
            key={index}
            variant={isActive ? "default" : "ghost"}
            size="icon"
            className={`w-12 h-12 transition-all ${
              isActive 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:text-primary hover:bg-accent"
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
