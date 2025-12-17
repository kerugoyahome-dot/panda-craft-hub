import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";

interface TeamMember {
  id: string;
  full_name: string | null;
  department_type: string | null;
}

interface AssignTeamDialogProps {
  projectId: string;
  projectName: string;
  currentAssignee?: string | null;
  onAssigned?: () => void;
}

export const AssignTeamDialog = ({
  projectId,
  projectName,
  currentAssignee,
  onAssigned,
}: AssignTeamDialogProps) => {
  const [open, setOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>(currentAssignee || "");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchTeamMembers();
    }
  }, [open]);

  const fetchTeamMembers = async () => {
    try {
      // Get users with team role
      const { data: teamRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "team");

      if (rolesError) throw rolesError;

      if (teamRoles && teamRoles.length > 0) {
        const userIds = teamRoles.map((r) => r.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, department_type")
          .in("id", userIds);

        if (profilesError) throw profilesError;
        setTeamMembers(profiles || []);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  const handleAssign = async () => {
    if (!selectedMember) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("projects")
        .update({ assigned_team_id: selectedMember })
        .eq("id", projectId);

      if (error) throw error;

      // Log activity
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", selectedMember)
        .single();

      await supabase.from("team_activity").insert([
        {
          user_id: selectedMember,
          activity_type: "project",
          description: `Assigned to project: ${projectName}`,
          project_id: projectId,
        },
      ]);

      toast({
        title: "Success",
        description: `Project assigned to ${profile?.full_name || "team member"}`,
      });

      setOpen(false);
      onAssigned?.();
    } catch (error) {
      console.error("Error assigning project:", error);
      toast({
        title: "Error",
        description: "Failed to assign project",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentLabel = (dept: string | null) => {
    const labels: Record<string, string> = {
      financial: "Financial",
      graphic_design: "Graphic Design",
      developers: "Developers",
      advertising: "Advertising",
      compliance: "Compliance",
      management: "Management",
    };
    return dept ? labels[dept] || dept : "No Department";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-cyber-blue border-cyber-blue/50 hover:bg-cyber-blue/10"
        >
          <UserPlus className="h-4 w-4 mr-1" />
          Assign
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-cyber-gray border-2 border-cyber-blue/30">
        <DialogHeader>
          <DialogTitle className="font-orbitron text-cyber-blue">
            ASSIGN TEAM MEMBER
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground font-share-tech mb-2">
              Project: <span className="text-white">{projectName}</span>
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-cyber-blue font-share-tech">Select Team Member</Label>
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger className="bg-cyber-gray border-cyber-blue/30">
                <SelectValue placeholder="Choose a team member" />
              </SelectTrigger>
              <SelectContent className="bg-cyber-gray border-cyber-blue/30">
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name || "Unnamed"} - {getDepartmentLabel(member.department_type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={loading || !selectedMember}
              className="bg-cyber-blue/20 border border-cyber-blue hover:bg-cyber-blue/30"
            >
              {loading ? "Assigning..." : "Assign"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
