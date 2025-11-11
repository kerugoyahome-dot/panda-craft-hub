import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface Client {
  id: string;
  name: string;
}

interface TeamMember {
  id: string;
  full_name: string | null;
}

export const CreateProjectDialog = ({ open, onOpenChange, onSuccess }: CreateProjectDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "planning",
    start_date: "",
    end_date: "",
    client_id: "",
    assigned_team_id: "",
  });

  useEffect(() => {
    if (open) {
      fetchClients();
      fetchTeamMembers();
    }
  }, [open]);

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("id, name")
      .order("name");

    if (!error) {
      setClients(data || []);
    }
  };

  const fetchTeamMembers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name");

    if (!error) {
      setTeamMembers(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.client_id) {
      toast({
        title: "Error",
        description: "Please select a client for this project",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.from("projects").insert([
        {
          name: formData.name,
          description: formData.description || null,
          status: formData.status,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          client_id: formData.client_id,
          assigned_team_id: formData.assigned_team_id || null,
          created_by: user.id,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project created successfully",
      });

      setFormData({
        name: "",
        description: "",
        status: "planning",
        start_date: "",
        end_date: "",
        client_id: "",
        assigned_team_id: "",
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-cyber-gray border-2 border-cyber-blue/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-cyber-blue font-orbitron text-xl">
            CREATE NEW PROJECT
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-cyber-blue font-share-tech">
              PROJECT NAME
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-cyber-gray/50 border-cyber-blue/30 text-white font-mono"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-cyber-blue font-share-tech">
              DESCRIPTION
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-cyber-gray/50 border-cyber-blue/30 text-white font-mono min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client" className="text-cyber-blue font-share-tech">
              CLIENT *
            </Label>
            <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
              <SelectTrigger className="bg-cyber-gray/50 border-cyber-blue/30 text-white">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent className="bg-cyber-gray border-cyber-blue/30">
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id} className="text-white">
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="team" className="text-cyber-blue font-share-tech">
              ASSIGN TO TEAM MEMBER
            </Label>
            <Select value={formData.assigned_team_id} onValueChange={(value) => setFormData({ ...formData, assigned_team_id: value })}>
              <SelectTrigger className="bg-cyber-gray/50 border-cyber-blue/30 text-white">
                <SelectValue placeholder="Select team member (optional)" />
              </SelectTrigger>
              <SelectContent className="bg-cyber-gray border-cyber-blue/30">
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id} className="text-white">
                    {member.full_name || "Unnamed User"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-cyber-blue font-share-tech">
              STATUS
            </Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger className="bg-cyber-gray/50 border-cyber-blue/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-cyber-gray border-cyber-blue/30">
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date" className="text-cyber-blue font-share-tech">
                START DATE
              </Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="bg-cyber-gray/50 border-cyber-blue/30 text-white font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date" className="text-cyber-blue font-share-tech">
                END DATE
              </Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="bg-cyber-gray/50 border-cyber-blue/30 text-white font-mono"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-cyber-blue/20 hover:bg-cyber-blue/30 border-2 border-cyber-blue text-cyber-blue-glow font-share-tech"
          >
            {loading ? "CREATING..." : "CREATE PROJECT"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
