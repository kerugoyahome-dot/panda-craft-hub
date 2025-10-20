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

interface CreateDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateDocumentDialog = ({ open, onOpenChange, onSuccess }: CreateDocumentDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);

      let filePath = null;
      let fileName = null;
      let fileType = null;
      let fileSize = null;

      // Upload file if provided
      if (file) {
        const fileExt = file.name.split(".").pop();
        fileName = file.name;
        fileType = file.type;
        fileSize = file.size;
        const storagePath = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(storagePath, file);

        if (uploadError) throw uploadError;
        filePath = storagePath;
      }

      // Create document record
      const { error: dbError } = await supabase.from("documents").insert([
        {
          title: formData.title,
          content: formData.content || null,
          file_path: filePath,
          file_name: fileName,
          file_type: fileType,
          file_size: fileSize,
          created_by: user.id,
        },
      ]);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Document created successfully",
      });

      setFormData({ title: "", content: "" });
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
      <DialogContent className="bg-cyber-gray border-2 border-cyber-blue/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-cyber-blue font-orbitron text-xl">
            CREATE DOCUMENT
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-cyber-blue font-share-tech">
              DOCUMENT TITLE
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-cyber-gray/50 border-cyber-blue/30 text-white font-mono"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="text-cyber-blue font-share-tech">
              CONTENT (optional)
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="bg-cyber-gray/50 border-cyber-blue/30 text-white font-mono min-h-[120px]"
              placeholder="Enter document content or attach a file below"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file" className="text-cyber-blue font-share-tech">
              ATTACH FILE (optional)
            </Label>
            <div className="relative">
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                className="bg-cyber-gray/50 border-cyber-blue/30 text-white font-mono file:bg-cyber-blue/20 file:text-cyber-blue file:border-0 file:font-share-tech"
                accept=".pdf,.doc,.docx,.txt,.md"
              />
              <Upload className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-blue pointer-events-none" />
            </div>
            {file && (
              <p className="text-xs text-cyber-blue font-mono">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-cyber-blue/20 hover:bg-cyber-blue/30 border-2 border-cyber-blue text-cyber-blue-glow font-share-tech"
          >
            {loading ? "CREATING..." : "CREATE DOCUMENT"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
