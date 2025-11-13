import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutDashboard, Users, Briefcase, Eye } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

const AdminDashboardSwitcher = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const dashboards = [
    {
      name: "Admin Dashboard",
      path: "/",
      icon: LayoutDashboard,
      description: "Full system control"
    },
    {
      name: "Team View",
      path: "/team-dashboard",
      icon: Users,
      description: "Preview team dashboard"
    },
    {
      name: "Client View",
      path: "/client-portal",
      icon: Briefcase,
      description: "Preview client portal"
    }
  ];

  const currentDashboard = dashboards.find(d => d.path === location.pathname) || dashboards[0];

  const handleDashboardSwitch = (path: string, name: string) => {
    console.log('Switching to:', path, name);
    navigate(path);
    toast.success(`Switched to ${name}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 bg-gradient-to-r from-cyber-blue/20 to-cyber-green/20 border-2 border-cyber-blue hover:border-cyber-green text-white hover:shadow-[0_0_20px_rgba(0,191,255,0.5)] font-share-tech transition-all px-4 py-2"
        >
          <Eye className="h-5 w-5 text-cyber-blue animate-pulse" />
          <div className="flex flex-col items-start">
            <span className="text-xs text-cyber-green">SWITCH VIEW</span>
            <span className="text-sm font-bold">{currentDashboard.name}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-cyber-gray border-cyber-blue/30">
        <DropdownMenuLabel className="text-cyber-blue font-orbitron">
          SWITCH DASHBOARD VIEW
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-cyber-blue/20" />
        {dashboards.map((dashboard) => {
          const Icon = dashboard.icon;
          const isActive = location.pathname === dashboard.path;
          
          return (
            <DropdownMenuItem
              key={dashboard.path}
              onClick={(e) => {
                e.preventDefault();
                handleDashboardSwitch(dashboard.path, dashboard.name);
              }}
              disabled={isActive}
              className={`cursor-pointer font-share-tech ${
                isActive 
                  ? "bg-cyber-blue/20 text-cyber-blue opacity-50 cursor-not-allowed" 
                  : "text-white hover:bg-cyber-blue/10 hover:text-cyber-blue"
              }`}
            >
              <Icon className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium">{dashboard.name}</span>
                <span className="text-xs text-muted-foreground">
                  {dashboard.description}
                  {isActive && " (Current)"}
                </span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AdminDashboardSwitcher;
