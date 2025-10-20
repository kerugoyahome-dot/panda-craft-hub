import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";

interface UploadDesignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const UploadDesignDialog = ({ open, onOpenChange, onSuccess }: UploadDesignDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tags: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file) return;

    try {
      setLoading(true);

      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("designs")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("designs")
        .getPublicUrl(fileName);

      // Create design record
      const { error: dbError } = await supabase.from("designs").insert([
        {
          title: formData.title,
          description: formData.description,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          thumbnail_path: publicUrl,
          tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : null,
          created_by: user.id,
        },
      ]);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Design uploaded successfully",
      });

      setFormData({ title: "", description: "", tags: "" });
      setFile(null);
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
      <DialogContent className="bg-cyber-gray border-2 border-cyber-green/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-cyber-green font-orbitron text-xl">
            UPLOAD DESIGN
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file" className="text-cyber-green font-share-tech">
              DESIGN FILE
            </Label>
            <div className="relative">
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                className="bg-cyber-gray/50 border-cyber-green/30 text-white font-mono file:bg-cyber-green/20 file:text-cyber-green file:border-0 file:font-share-tech"
                accept="image/*,.pdf,.sketch,.fig"
                required
              />
              <Upload className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-green pointer-events-none" />
            </div>
            {file && (
              <p className="text-xs text-cyber-green font-mono">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-cyber-green font-share-tech">
              TITLE
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-cyber-gray/50 border-cyber-green/30 text-white font-mono"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-cyber-green font-share-tech">
              DESCRIPTION
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-cyber-gray/50 border-cyber-green/30 text-white font-mono min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags" className="text-cyber-green font-share-tech">
              TAGS (comma-separated)
            </Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="logo, branding, web"
              className="bg-cyber-gray/50 border-cyber-green/30 text-white font-mono"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-cyber-green/20 hover:bg-cyber-green/30 border-2 border-cyber-green text-cyber-green font-share-tech"
          >
            {loading ? "UPLOADING..." : "UPLOAD DESIGN"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
