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
import { NotificationCenter } from "@/components/NotificationCenter";

const Header = () => {
  const { user, signOut, isAdmin } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);

  return (
    <>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <LockScreen open={lockOpen} onOpenChange={setLockOpen} />
      <header className="fixed top-0 left-20 right-0 h-16 bg-card/95 backdrop-blur-sm border-b border-border flex items-center justify-between px-8 z-10 shadow-sm">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-4 flex-1 max-w-xl group"
        >
          <Search className="h-5 w-5 text-muted-foreground" />
          <div className="w-full p-2 rounded-md border border-border bg-muted/50 text-left text-muted-foreground text-sm hover:border-primary/30 transition-colors">
            Search...
          </div>
        </button>
      
      <div className="flex items-center gap-4">
        {isAdmin && (
          <div className="flex items-center gap-2">
            <AdminDashboardSwitcher />
          </div>
        )}
        
        <NotificationCenter />
        
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 pl-4 border-l border-border cursor-pointer hover:opacity-80 transition-opacity">
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {user.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full bg-primary/10 border border-primary/20">
                  <User className="h-5 w-5 text-primary" />
                </Button>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLockOpen(true)} className="cursor-pointer">
                <Lock className="mr-2 h-4 w-4" />
                <span>Lock Screen</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
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
