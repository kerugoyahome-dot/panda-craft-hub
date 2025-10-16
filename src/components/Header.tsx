import { Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Header = () => {
  return (
    <header className="fixed top-0 left-20 right-0 h-16 bg-card/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-8 z-10">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Search projects, clients, documents..." 
          className="border-none bg-secondary focus-visible:ring-gold"
        />
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-gold rounded-full"></span>
        </Button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="text-right">
            <p className="text-sm font-medium">Admin User</p>
            <p className="text-xs text-muted-foreground">admin@pandatech.co.ke</p>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full bg-gradient-gold">
            <User className="h-5 w-5 text-black" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
