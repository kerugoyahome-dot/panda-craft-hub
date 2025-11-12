import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AddClientDialog = ({ open, onOpenChange, onSuccess }: AddClientDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clientUsers, setClientUsers] = useState<Array<{ id: string; email: string; full_name: string }>>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
    user_id: "",
  });

  useEffect(() => {
    if (open) {
      fetchClientUsers();
    }
  }, [open]);

  const fetchClientUsers = async () => {
    try {
      const { data: clientRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "client");

      if (!clientRoles || clientRoles.length === 0) return;

      const userIds = clientRoles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const clientUsersList = profiles?.map(profile => ({
        id: profile.id,
        email: profile.id.substring(0, 8) + "...", // Show partial ID as placeholder
        full_name: profile.full_name || "No name"
      })) || [];

      setClientUsers(clientUsersList);
    } catch (error) {
      console.error("Error fetching client users:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase.from("clients").insert([
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          notes: formData.notes,
          user_id: formData.user_id || null,
          created_by: user.id,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client added successfully",
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        notes: "",
        user_id: "",
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
            ADD NEW CLIENT
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-cyber-blue font-share-tech">
              CLIENT NAME
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
            <Label htmlFor="email" className="text-cyber-blue font-share-tech">
              EMAIL
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-cyber-gray/50 border-cyber-blue/30 text-white font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-cyber-blue font-share-tech">
              PHONE
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="bg-cyber-gray/50 border-cyber-blue/30 text-white font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company" className="text-cyber-blue font-share-tech">
              COMPANY
            </Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="bg-cyber-gray/50 border-cyber-blue/30 text-white font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user" className="text-cyber-blue font-share-tech">
              LINK TO USER ACCOUNT (OPTIONAL)
            </Label>
            <Select
              value={formData.user_id}
              onValueChange={(value) => setFormData({ ...formData, user_id: value })}
            >
              <SelectTrigger className="bg-cyber-gray/50 border-cyber-blue/30 text-white font-mono">
                <SelectValue placeholder="Select a user with client role" />
              </SelectTrigger>
              <SelectContent className="bg-cyber-gray border-cyber-blue/30">
                {clientUsers.map((clientUser) => (
                  <SelectItem key={clientUser.id} value={clientUser.id} className="text-white">
                    {clientUser.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-cyber-blue font-share-tech">
              NOTES
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="bg-cyber-gray/50 border-cyber-blue/30 text-white font-mono min-h-[80px]"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-cyber-blue/20 hover:bg-cyber-blue/30 border-2 border-cyber-blue text-cyber-blue-glow font-share-tech"
          >
            {loading ? "ADDING..." : "ADD CLIENT"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
