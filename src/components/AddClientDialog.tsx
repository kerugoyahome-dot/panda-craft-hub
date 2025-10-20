import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase.from("clients").insert([
        {
          ...formData,
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
