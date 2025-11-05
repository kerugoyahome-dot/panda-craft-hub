import { useState } from "react";
import { Bell, Search, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchDialog } from "@/components/SearchDialog";
import AdminDashboardSwitcher from "@/components/AdminDashboardSwitcher";

const Header = () => {
  const { user, signOut, isAdmin } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <header className="fixed top-0 left-20 right-0 h-16 bg-black/90 backdrop-blur-xl border-b-2 border-cyber-blue/30 flex items-center justify-between px-8 z-10 shadow-[0_0_20px_rgba(0,191,255,0.2)]">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-4 flex-1 max-w-xl group"
        >
          <Search className="h-5 w-5 text-cyber-blue" />
          <div className="w-full p-2 rounded-md border border-cyber-blue/30 bg-cyber-gray text-left text-muted-foreground font-share-tech hover:border-cyber-blue/50 transition-colors">
            ▸ SEARCH DATABASE...
          </div>
        </button>
      
      <div className="flex items-center gap-4">
        {isAdmin && <AdminDashboardSwitcher />}
        
        <Button variant="ghost" size="icon" className="relative hover:bg-cyber-blue/10 hover:shadow-[0_0_15px_rgba(0,191,255,0.3)]">
          <Bell className="h-5 w-5 text-cyber-blue" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-cyber-green rounded-full animate-pulse"></span>
        </Button>
        
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 pl-4 border-l-2 border-cyber-blue/30 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="text-right">
                  <p className="text-sm font-medium font-orbitron text-cyber-blue">
                    {user.user_metadata?.full_name || 'AGENT'}
                  </p>
                  <p className="text-xs text-cyber-green font-share-tech">{user.email}</p>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full bg-gradient-to-br from-cyber-blue/20 to-cyber-green/20 border-2 border-cyber-blue hover:shadow-[0_0_20px_rgba(0,191,255,0.5)]">
                  <User className="h-5 w-5 text-cyber-blue" />
                </Button>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-cyber-gray border-2 border-cyber-blue/30">
              <DropdownMenuLabel className="font-orbitron text-cyber-blue">ACCOUNT ACCESS</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-cyber-blue/20" />
              <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer font-share-tech hover:bg-destructive/10">
                <LogOut className="mr-2 h-4 w-4" />
                <span>TERMINATE SESSION</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        </div>
      </header>
    </>
  );
};

export default Header;
