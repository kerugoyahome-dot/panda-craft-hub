import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home, Shield, UserCheck, User as UserIcon, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePresence } from "@/hooks/usePresence";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { AddTeamMemberDialog } from "@/components/AddTeamMemberDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PresenceIndicator } from "@/components/PresenceIndicator";

interface TeamMember {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  department: string | null;
  department_type: string | null;
  created_at: string;
  email?: string;
  role?: string;
}

const DEPARTMENTS = [
  { value: "financial", label: "Financial" },
  { value: "graphic_design", label: "Graphic Design" },
  { value: "developers", label: "Developers" },
  { value: "advertising", label: "Advertising" },
  { value: "compliance", label: "Compliance" },
  { value: "management", label: "Management" },
];

const Team = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isOnline } = usePresence();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, department, department_type, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Combine data
      const membersWithRoles = profiles?.map((profile) => {
        const role = userRoles?.find((r) => r.user_id === profile.id);
        return {
          ...profile,
          role: (role?.role as string) || "client",
          email: "user@example.com", // Simplified - auth.admin not available in client
        };
      }) || [];

      setTeamMembers(membersWithRoles);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch team members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // Check if role exists
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole as any })
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole as any });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Role updated successfully",
      });
      
      fetchTeamMembers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
    }
  };

  const handleDepartmentChange = async (userId: string, newDept: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ department_type: newDept as any })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Department updated successfully",
      });
      
      fetchTeamMembers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update department",
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return { variant: "default" as const, icon: Shield, color: "text-cyber-blue" };
      case "team":
        return { variant: "secondary" as const, icon: UserCheck, color: "text-cyber-green" };
      case "moderator":
        return { variant: "secondary" as const, icon: UserCheck, color: "text-purple-400" };
      default:
        return { variant: "outline" as const, icon: UserIcon, color: "text-muted-foreground" };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-cyber-gray/10 to-background">
      <Navigation />
      <div className="ml-20">
        <Header />
        <main className="pt-24 px-8 pb-8">
          <AddTeamMemberDialog
            open={addMemberDialogOpen}
            onOpenChange={setAddMemberDialogOpen}
            onSuccess={fetchTeamMembers}
          />

          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/")}
                className="hover:bg-cyber-blue/10"
              >
                <Home className="h-5 w-5 text-cyber-blue" />
              </Button>
              <div>
                <h1 className="text-4xl font-bold font-orbitron text-cyber-blue-glow mb-2">
                  TEAM MANAGEMENT
                </h1>
                <p className="text-muted-foreground font-share-tech">
                  Manage team members and their roles
                </p>
              </div>
            </div>
            <Button
              onClick={() => setAddMemberDialogOpen(true)}
              className="bg-gradient-to-r from-cyber-blue to-cyber-green hover:shadow-[0_0_20px_rgba(0,191,255,0.5)] font-share-tech"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              ADD TEAM MEMBER
            </Button>
          </div>

          <div className="grid gap-6">
            <Card className="bg-cyber-gray/50 border-2 border-cyber-blue/30 shadow-[0_0_30px_rgba(0,191,255,0.1)]">
              <CardHeader>
                <CardTitle className="font-orbitron text-cyber-blue flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  TEAM MEMBERS ({teamMembers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-cyber-blue font-share-tech">
                    LOADING TEAM DATA...
                  </div>
                ) : teamMembers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground font-share-tech">
                    NO TEAM MEMBERS FOUND
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-cyber-blue/30">
                        <TableHead className="font-share-tech text-cyber-blue">NAME</TableHead>
                        <TableHead className="font-share-tech text-cyber-blue">EMAIL</TableHead>
                        <TableHead className="font-share-tech text-cyber-blue">DEPARTMENT</TableHead>
                        <TableHead className="font-share-tech text-cyber-blue">ROLE</TableHead>
                        <TableHead className="font-share-tech text-cyber-blue">ACTIONS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamMembers.map((member) => {
                        const roleBadge = getRoleBadge(member.role || "client");
                        const RoleIcon = roleBadge.icon;
                        return (
                          <TableRow key={member.id} className="border-cyber-blue/20">
                            <TableCell className="font-medium font-share-tech">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <Avatar>
                                    <AvatarImage src={member.avatar_url || undefined} />
                                    <AvatarFallback className="bg-cyber-blue/20 text-cyber-blue">
                                      {member.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="absolute -bottom-1 -right-1">
                                    <PresenceIndicator isOnline={isOnline(member.id)} size="md" />
                                  </div>
                                </div>
                                <span className="text-white">{member.full_name || "UNNAMED USER"}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {member.email}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={member.department_type || ""}
                                onValueChange={(value) => handleDepartmentChange(member.id, value)}
                              >
                                <SelectTrigger className="w-[140px] bg-cyber-gray border-cyber-blue/30 font-share-tech">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent className="bg-cyber-gray border-cyber-blue/30">
                                  {DEPARTMENTS.map((dept) => (
                                    <SelectItem key={dept.value} value={dept.value} className="font-share-tech">
                                      {dept.label.toUpperCase()}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Badge variant={roleBadge.variant} className="font-share-tech">
                                <RoleIcon className={`h-3 w-3 mr-1 ${roleBadge.color}`} />
                                {(member.role || "client").toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={member.role || "client"}
                                onValueChange={(value) => handleRoleChange(member.id, value)}
                                disabled={member.id === user?.id}
                              >
                                <SelectTrigger className="w-[140px] bg-cyber-gray border-cyber-blue/30 font-share-tech">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-cyber-gray border-cyber-blue/30">
                                  <SelectItem value="admin" className="font-share-tech">ADMIN</SelectItem>
                                  <SelectItem value="team" className="font-share-tech">TEAM</SelectItem>
                                  <SelectItem value="moderator" className="font-share-tech">MODERATOR</SelectItem>
                                  <SelectItem value="client" className="font-share-tech">CLIENT</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Team;
