import { useState } from "react";
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

export const CreateProjectDialog = ({ open, onOpenChange, onSuccess }: CreateProjectDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "planning",
    start_date: "",
    end_date: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase.from("projects").insert([
        {
          ...formData,
          created_by: user.id,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
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
