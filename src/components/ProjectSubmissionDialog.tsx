import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileUp } from "lucide-react";

interface ProjectSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: {
    id: string;
    name: string;
    progress: number;
  };
  onSuccess?: () => void;
}

export const ProjectSubmissionDialog = ({
  open,
  onOpenChange,
  project,
  onSuccess,
}: ProjectSubmissionDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState([project.progress]);
  const [formData, setFormData] = useState({
    submissionType: "design" as "design" | "document" | "code" | "other",
    notes: "",
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
      let fileSize = null;

      // Upload file if provided
      if (file) {
        const fileExt = file.name.split(".").pop();
        const uploadPath = `${user.id}/${project.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(uploadPath, file);

        if (uploadError) throw uploadError;

        filePath = uploadPath;
        fileName = file.name;
        fileSize = file.size;
      }

      // Create submission record
      const { error: submissionError } = await supabase.from("project_submissions").insert([
        {
          project_id: project.id,
          submitted_by: user.id,
          file_path: filePath,
          file_name: fileName,
          file_size: fileSize,
          submission_type: formData.submissionType,
          notes: formData.notes || null,
        },
      ]);

      if (submissionError) throw submissionError;

      // Update project progress and submitted_at
      const { error: updateError } = await supabase
        .from("projects")
        .update({
          progress: progress[0],
          submitted_at: progress[0] === 100 ? new Date().toISOString() : null,
          submission_notes: formData.notes || null,
        })
        .eq("id", project.id);

      if (updateError) throw updateError;

      // Log activity
      await supabase.from("team_activity").insert([
        {
          user_id: user.id,
          activity_type: "submission",
          description: `Submitted ${formData.submissionType} for project: ${project.name} (${progress[0]}% complete)`,
          project_id: project.id,
        },
      ]);

      toast({
        title: "Success",
        description: progress[0] === 100 
          ? "Project submitted successfully!" 
          : "Progress updated successfully!",
      });

      setFormData({ submissionType: "design", notes: "" });
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
      <DialogContent className="bg-cyber-gray border-2 border-cyber-blue/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-cyber-blue font-orbitron text-xl">
            SUBMIT WORK
          </DialogTitle>
          <p className="text-sm text-muted-foreground font-share-tech">
            {project.name}
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-cyber-green font-share-tech">
              SUBMISSION TYPE
            </Label>
            <Select
              value={formData.submissionType}
              onValueChange={(value) =>
                setFormData({ ...formData, submissionType: value as any })
              }
            >
              <SelectTrigger className="bg-cyber-gray/50 border-cyber-blue/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-cyber-gray border-cyber-blue/30">
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="code">Code/Software</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file" className="text-cyber-green font-share-tech">
              UPLOAD FILE (Optional)
            </Label>
            <div className="relative">
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                className="bg-cyber-gray/50 border-cyber-blue/30 text-white font-mono file:bg-cyber-blue/20 file:text-cyber-blue file:border-0 file:font-share-tech"
              />
              <FileUp className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-blue pointer-events-none" />
            </div>
            {file && (
              <p className="text-xs text-cyber-green font-mono">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label className="text-cyber-green font-share-tech">
                PROJECT PROGRESS
              </Label>
              <span className="text-cyber-blue font-share-tech">{progress[0]}%</span>
            </div>
            <Slider
              value={progress}
              onValueChange={setProgress}
              max={100}
              step={5}
              className="w-full"
            />
            {progress[0] === 100 && (
              <p className="text-xs text-cyber-green font-share-tech animate-pulse">
                ✓ Project will be marked as completed
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-cyber-green font-share-tech">
              NOTES
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes about this submission..."
              className="bg-cyber-gray/50 border-cyber-blue/30 text-white font-mono min-h-[80px]"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-cyber-blue/20 hover:bg-cyber-blue/30 border-2 border-cyber-blue text-cyber-blue font-share-tech"
          >
            {loading ? "SUBMITTING..." : progress[0] === 100 ? "COMPLETE PROJECT" : "UPDATE PROGRESS"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
