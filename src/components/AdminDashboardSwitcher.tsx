import { useState } from "react";
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 bg-cyber-gray/30 border-cyber-blue/30 hover:border-cyber-blue/50 text-cyber-blue hover:bg-cyber-blue/10 font-share-tech"
        >
          <Eye className="h-4 w-4" />
          <span className="hidden sm:inline">{currentDashboard.name}</span>
          <span className="sm:hidden">View</span>
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
              onClick={() => navigate(dashboard.path)}
              className={`cursor-pointer font-share-tech ${
                isActive 
                  ? "bg-cyber-blue/20 text-cyber-blue" 
                  : "text-white hover:bg-cyber-blue/10 hover:text-cyber-blue"
              }`}
            >
              <Icon className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium">{dashboard.name}</span>
                <span className="text-xs text-muted-foreground">
                  {dashboard.description}
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
