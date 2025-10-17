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
    { icon: Palette, label: "Design", path: "#" },
    { icon: FileText, label: "Documents", path: "#" },
    { icon: Code2, label: "Dev Hub", path: "#" },
    { icon: BarChart3, label: "Analytics", path: "#" },
    { icon: Settings, label: "Settings", path: "#" },
  ];

  return (
    <nav className="fixed left-0 top-0 h-screen w-20 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-6 gap-4">
      <div className="mb-8">
        <div className="w-12 h-12 bg-gradient-gold rounded-xl flex items-center justify-center font-bold text-2xl">
          🐼
        </div>
      </div>
      
      {navItems.map((item, index) => {
        const isActive = location.pathname === item.path || (location.pathname.startsWith('/kanban') && item.path === '/projects');
        return (
          <Button
            key={index}
            variant={isActive ? "default" : "ghost"}
            size="icon"
            className={`w-12 h-12 transition-all duration-300 ${
              isActive 
                ? "bg-gold text-black shadow-gold hover:bg-gold-dark" 
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
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
