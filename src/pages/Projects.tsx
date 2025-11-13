import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Pencil, Trash2, KanbanSquare, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";

interface Project {
  id: string;
  name: string;
  description: string | null;
  client_id: string | null;
  status: string;
  progress: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
}

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    client_id: "",
    status: "planning",
    progress: 0,
    start_date: "",
    end_date: "",
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
    fetchClients();

    // Set up real-time subscription
    const channel = supabase
      .channel('projects-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
        },
        () => {
          fetchProjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

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

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("id, name")
      .order("name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch clients",
        variant: "destructive",
      });
    } else {
      setClients(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const projectData = {
      ...formData,
      client_id: formData.client_id || null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
    };

    if (editingProject) {
      const { error } = await supabase
        .from("projects")
        .update(projectData)
        .eq("id", editingProject.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update project",
          variant: "destructive",
        });
      } else {
        toast({ title: "Success", description: "Project updated successfully" });
        fetchProjects();
        handleCloseDialog();
      }
    } else {
      const { error } = await supabase
        .from("projects")
        .insert([{ ...projectData, created_by: user?.id }]);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create project",
          variant: "destructive",
        });
      } else {
        toast({ title: "Success", description: "Project created successfully" });
        fetchProjects();
        handleCloseDialog();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    const { error } = await supabase.from("projects").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "Project deleted successfully" });
      fetchProjects();
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || "",
      client_id: project.client_id || "",
      status: project.status,
      progress: project.progress,
      start_date: project.start_date || "",
      end_date: project.end_date || "",
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProject(null);
    setFormData({
      name: "",
      description: "",
      client_id: "",
      status: "planning",
      progress: 0,
      start_date: "",
      end_date: "",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning":
        return "secondary";
      case "in_progress":
        return "default";
      case "completed":
        return "outline";
      case "on_hold":
        return "destructive";
      default:
        return "default";
    }
  };

  const getClientName = (clientId: string | null) => {
    if (!clientId) return "-";
    const client = clients.find(c => c.id === clientId);
    return client?.name || "-";
  };

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <Header />
      <div className="ml-20 pt-16 p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-cyber-blue-glow font-orbitron">PROJECTS</h1>
            <p className="text-muted-foreground font-share-tech">Manage all projects</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingProject(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProject ? "Edit Project" : "Add New Project"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="client">Client</Label>
                <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="progress">Progress: {formData.progress}%</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProject ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <Badge variant={getStatusColor(project.status)}>
                  {project.status.replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {project.description || "No description"}
              </p>
              <div className="text-sm">
                <span className="font-medium">Client:</span> {getClientName(project.client_id)}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <Progress value={project.progress} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/kanban/${project.id}`)}
                >
                  <KanbanSquare className="h-4 w-4 mr-1" />
                  Board
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(project)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(project.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Projects;