import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type DepartmentType = Database["public"]["Enums"]["department_type"];

interface ProposalCreatorProps {
  onSuccess?: () => void;
}

export const ProposalCreator = ({ onSuccess }: ProposalCreatorProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    client_name: "",
    department_type: "" as DepartmentType | "",
    estimated_hours: "",
    estimated_budget: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.title || !formData.department_type) {
      toast.error("Please fill in required fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("project_proposals").insert({
        title: formData.title,
        description: formData.description || null,
        client_name: formData.client_name || null,
        department_type: formData.department_type as DepartmentType,
        estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : null,
        estimated_budget: formData.estimated_budget ? parseFloat(formData.estimated_budget) : null,
        proposed_by: user.id,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Proposal submitted successfully!");
      setFormData({
        title: "",
        description: "",
        client_name: "",
        department_type: "",
        estimated_hours: "",
        estimated_budget: "",
      });
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit proposal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/50 hover:bg-cyber-blue/30 font-share-tech">
          <Plus className="w-4 h-4 mr-2" />
          NEW PROPOSAL
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-cyber-gray border-2 border-cyber-blue/50 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-cyber-blue font-orbitron">CREATE PROJECT PROPOSAL</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-cyber-green font-share-tech">Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-black/50 border-cyber-blue/30 text-white"
              placeholder="Project title"
              required
            />
          </div>
          <div>
            <Label className="text-cyber-green font-share-tech">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-black/50 border-cyber-blue/30 text-white min-h-[100px]"
              placeholder="Describe the project..."
            />
          </div>
          <div>
            <Label className="text-cyber-green font-share-tech">Client Name</Label>
            <Input
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              className="bg-black/50 border-cyber-blue/30 text-white"
              placeholder="Client name"
            />
          </div>
          <div>
            <Label className="text-cyber-green font-share-tech">Department *</Label>
            <Select
              value={formData.department_type}
              onValueChange={(value) => setFormData({ ...formData, department_type: value as DepartmentType })}
            >
              <SelectTrigger className="bg-black/50 border-cyber-blue/30 text-white">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent className="bg-cyber-gray border-cyber-blue/30">
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="graphic_design">Graphic Design</SelectItem>
                <SelectItem value="developers">Developers</SelectItem>
                <SelectItem value="advertising">Advertising</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="management">Management</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-cyber-green font-share-tech">Est. Hours</Label>
              <Input
                type="number"
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                className="bg-black/50 border-cyber-blue/30 text-white"
                placeholder="Hours"
              />
            </div>
            <div>
              <Label className="text-cyber-green font-share-tech">Est. Budget ($)</Label>
              <Input
                type="number"
                value={formData.estimated_budget}
                onChange={(e) => setFormData({ ...formData, estimated_budget: e.target.value })}
                className="bg-black/50 border-cyber-blue/30 text-white"
                placeholder="Budget"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-cyber-blue text-black font-bold hover:bg-cyber-blue-glow font-share-tech"
          >
            {loading ? "SUBMITTING..." : "SUBMIT PROPOSAL"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
