import { LayoutDashboard, Users, FolderKanban, Palette, FileText, Code2, BarChart3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: Users, label: "Clients" },
    { icon: FolderKanban, label: "Projects" },
    { icon: Palette, label: "Design" },
    { icon: FileText, label: "Documents" },
    { icon: Code2, label: "Dev Hub" },
    { icon: BarChart3, label: "Analytics" },
    { icon: Settings, label: "Settings" },
  ];

  return (
    <nav className="fixed left-0 top-0 h-screen w-20 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-6 gap-4">
      <div className="mb-8">
        <div className="w-12 h-12 bg-gradient-gold rounded-xl flex items-center justify-center font-bold text-2xl">
          🐼
        </div>
      </div>
      
      {navItems.map((item, index) => (
        <Button
          key={index}
          variant={item.active ? "default" : "ghost"}
          size="icon"
          className={`w-12 h-12 transition-all duration-300 ${
            item.active 
              ? "bg-gold text-black shadow-gold hover:bg-gold-dark" 
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
          title={item.label}
        >
          <item.icon className="h-5 w-5" />
        </Button>
      ))}
    </nav>
  );
};

export default Navigation;
