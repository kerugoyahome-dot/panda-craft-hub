import { useState } from "react";
import { Search, User, LogOut, Lock } from "lucide-react";
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
import { LockScreen } from "@/components/LockScreen";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { NotificationCenter } from "@/components/NotificationCenter";

const Header = () => {
  const { user, signOut, isAdmin } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);

  return (
    <>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <LockScreen open={lockOpen} onOpenChange={setLockOpen} />
      <header className="fixed top-0 left-20 right-0 h-16 bg-background/90 backdrop-blur-xl border-b-2 border-primary/30 flex items-center justify-between px-8 z-10 shadow-cyber-glow transition-colors duration-300">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-4 flex-1 max-w-xl group"
        >
          <Search className="h-5 w-5 text-primary" />
          <div className="w-full p-2 rounded-md border border-primary/30 bg-muted text-left text-muted-foreground font-share-tech hover:border-primary/50 transition-colors">
            ▸ SEARCH DATABASE...
          </div>
        </button>
      
      <div className="flex items-center gap-6">
        {isAdmin && (
          <div className="flex items-center gap-2">
            <AdminDashboardSwitcher />
          </div>
        )}
        
        {/* Theme Switcher - Global Access */}
        <ThemeSwitcher />
        
        <NotificationCenter />
        
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 pl-4 border-l-2 border-primary/30 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="text-right">
                  <p className="text-sm font-medium font-orbitron text-primary">
                    {user.user_metadata?.full_name || 'AGENT'}
                  </p>
                  <p className="text-xs text-accent font-share-tech">{user.email}</p>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary hover:shadow-cyber-glow">
                  <User className="h-5 w-5 text-primary" />
                </Button>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-2 border-primary/30">
              <DropdownMenuLabel className="font-orbitron text-primary">ACCOUNT ACCESS</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-primary/20" />
              <DropdownMenuItem onClick={() => setLockOpen(true)} className="cursor-pointer font-share-tech hover:bg-primary/10">
                <Lock className="mr-2 h-4 w-4 text-primary" />
                <span className="text-primary">LOCK SCREEN</span>
              </DropdownMenuItem>
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
