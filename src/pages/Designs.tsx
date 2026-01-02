import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Home, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";

interface Design {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  file_name: string;
  file_size: number | null;
  thumbnail_path: string | null;
  project_id: string | null;
  tags: string[] | null;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
}

const Designs = () => {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project_id: "",
    tags: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDesigns();
    fetchProjects();
  }, []);

  const fetchDesigns = async () => {
    const { data, error } = await supabase
      .from("designs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch designs",
        variant: "destructive",
      });
    } else {
      setDesigns(data || []);
    }
  };

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("id, name")
      .order("name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive",
      });
    } else {
      setProjects(data || []);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile && !editingDesign) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    let filePath = editingDesign?.file_path || "";
    let fileName = editingDesign?.file_name || "";
    let fileSize = editingDesign?.file_size || null;

    // Upload file if selected
    if (selectedFile && user) {
      setUploading(true);
      const fileExt = selectedFile.name.split(".").pop();
      const newFilePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("designs")
        .upload(newFilePath, selectedFile);

      if (uploadError) {
        toast({
          title: "Error",
          description: "Failed to upload file",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      // Delete old file if updating
      if (editingDesign?.file_path) {
        await supabase.storage.from("designs").remove([editingDesign.file_path]);
      }

      filePath = newFilePath;
      fileName = selectedFile.name;
      fileSize = selectedFile.size;
      setUploading(false);
    }

    const tags = formData.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);

    const designData = {
      title: formData.title,
      description: formData.description || null,
      project_id: formData.project_id || null,
      file_path: filePath,
      file_name: fileName,
      file_size: fileSize,
      tags: tags.length > 0 ? tags : null,
    };

    if (editingDesign) {
      const { error } = await supabase
        .from("designs")
        .update(designData)
        .eq("id", editingDesign.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update design",
          variant: "destructive",
        });
      } else {
        toast({ title: "Success", description: "Design updated successfully" });
        fetchDesigns();
        handleCloseDialog();
      }
    } else {
      const { error } = await supabase
        .from("designs")
        .insert([{ ...designData, created_by: user?.id }]);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create design",
          variant: "destructive",
        });
      } else {
        toast({ title: "Success", description: "Design created successfully" });
        fetchDesigns();
        handleCloseDialog();
      }
    }
  };

  const handleDelete = async (id: string, filePath: string) => {
    if (!confirm("Are you sure you want to delete this design?")) return;

    // Delete file from storage
    await supabase.storage.from("designs").remove([filePath]);

    const { error } = await supabase.from("designs").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete design",
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "Design deleted successfully" });
      fetchDesigns();
    }
  };

  const handleEdit = (design: Design) => {
    setEditingDesign(design);
    setFormData({
      title: design.title,
      description: design.description || "",
      project_id: design.project_id || "",
      tags: design.tags?.join(", ") || "",
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingDesign(null);
    setSelectedFile(null);
    setPreviewUrl("");
    setFormData({
      title: "",
      description: "",
      project_id: "",
      tags: "",
    });
  };

  const getImageUrl = (filePath: string) => {
    const { data } = supabase.storage.from("designs").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const getProjectName = (projectId: string | null) => {
    if (!projectId) return null;
    const project = projects.find((p) => p.id === projectId);
    return project?.name;
  };

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <Header />
      <main className="ml-20 pt-16 p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-cyber-blue-glow font-orbitron">DESIGN GALLERY</h1>
            <p className="text-muted-foreground font-share-tech">Manage design assets</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingDesign ? "Edit Design" : "Upload New Design"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="file">Image File *</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*"
                  required={!editingDesign}
                />
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="mt-2 w-full h-48 object-cover rounded"
                  />
                )}
              </div>
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="project">Project</Label>
                <Select
                  value={formData.project_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, project_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="e.g. logo, branding, web"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? "Uploading..." : editingDesign ? "Update" : "Upload"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {designs.map((design) => (
            <Card key={design.id} className="overflow-hidden">
              <div className="relative aspect-video">
                <img
                  src={getImageUrl(design.file_path)}
                  alt={design.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{design.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {design.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {design.description}
                  </p>
                )}
                {getProjectName(design.project_id) && (
                  <Badge variant="outline">{getProjectName(design.project_id)}</Badge>
                )}
                {design.tags && design.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {design.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(design)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(design.id, design.file_path)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Designs;