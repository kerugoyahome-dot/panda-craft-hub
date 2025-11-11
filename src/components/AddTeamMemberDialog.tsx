import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, UserPlus, Shield } from "lucide-react";

interface AddTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface User {
  id: string;
  full_name: string | null;
  department: string | null;
}

export const AddTeamMemberDialog = ({ open, onOpenChange, onSuccess }: AddTeamMemberDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, department")
        .or(`full_name.ilike.%${searchQuery}%,department.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;

      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to search users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const assignTeamRole = async (userId: string) => {
    try {
      // Check if role already exists
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userId)
        .eq("role", "team")
        .maybeSingle();

      if (existingRole) {
        toast({
          title: "Already a team member",
          description: "This user is already assigned to the team role",
        });
        return;
      }

      // Insert team role
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "team" });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User added to team successfully",
      });

      onSuccess?.();
      onOpenChange(false);
      setSearchQuery("");
      setUsers([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add team member",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-cyber-gray border-2 border-cyber-blue/30 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-orbitron text-cyber-blue flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            ADD TEAM MEMBER
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyber-blue" />
            <Input
              placeholder="▸ SEARCH BY NAME OR DEPARTMENT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-cyber-gray/50 border-cyber-blue/30 text-white font-share-tech"
              autoFocus
            />
          </div>

          {loading && (
            <div className="text-center py-8 text-cyber-blue font-share-tech">
              SCANNING DATABASE...
            </div>
          )}

          {!loading && searchQuery.length >= 2 && users.length === 0 && (
            <div className="text-center py-8 text-muted-foreground font-share-tech">
              NO USERS FOUND
            </div>
          )}

          {!loading && users.length > 0 && (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-cyber-gray/50 border border-cyber-blue/30 hover:border-cyber-blue/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyber-blue/30 to-cyber-green/30 flex items-center justify-center border border-cyber-blue">
                      <Shield className="w-5 h-5 text-cyber-blue" />
                    </div>
                    <div>
                      <p className="font-medium text-white font-share-tech">
                        {user.full_name || "UNNAMED USER"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.department || "No department"}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => assignTeamRole(user.id)}
                    variant="outline"
                    size="sm"
                    className="border-cyber-blue/50 text-cyber-blue hover:bg-cyber-blue/10 font-share-tech"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    ADD TO TEAM
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
