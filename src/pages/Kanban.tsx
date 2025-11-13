import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
}

const Kanban = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchTasks();
    }
  }, [projectId]);

  const fetchProject = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("id, name")
      .eq("id", projectId)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch project",
        variant: "destructive",
      });
      navigate("/projects");
    } else {
      setProject(data);
    }
  };

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch tasks",
        variant: "destructive",
      });
    } else {
      setTasks(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingTask) {
      const { error } = await supabase
        .from("tasks")
        .update(formData)
        .eq("id", editingTask.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update task",
          variant: "destructive",
        });
      } else {
        toast({ title: "Success", description: "Task updated successfully" });
        fetchTasks();
        handleCloseDialog();
      }
    } else {
      const { error } = await supabase
        .from("tasks")
        .insert([{ ...formData, project_id: projectId, created_by: user?.id }]);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create task",
          variant: "destructive",
        });
      } else {
        toast({ title: "Success", description: "Task created successfully" });
        fetchTasks();
        handleCloseDialog();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "Task deleted successfully" });
      fetchTasks();
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
    });
    setIsDialogOpen(true);
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", taskId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    } else {
      fetchTasks();
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTask(null);
    setFormData({
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  const columns = [
    { id: "todo", title: "To Do" },
    { id: "in_progress", title: "In Progress" },
    { id: "done", title: "Done" },
  ];

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <Header />
      <div className="ml-20 pt-16 p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/projects")} className="hover:bg-cyber-blue/10">
            <ArrowLeft className="h-5 w-5 text-cyber-blue" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-cyber-blue-glow font-orbitron">
              {project?.name || "Loading..."} - KANBAN
            </h1>
            <p className="text-muted-foreground font-share-tech">Task management board</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTask(null)} className="ml-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingTask ? "Edit Task" : "Add New Task"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTask ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="space-y-4">
            <h2 className="text-xl font-semibold">{column.title}</h2>
            <div className="space-y-3">
              {tasks
                .filter((task) => task.status === column.id)
                .map((task) => (
                  <Card key={task.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-base">{task.title}</CardTitle>
                        <Badge variant={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {task.description}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Select
                          value={task.status}
                          onValueChange={(value) => handleStatusChange(task.id, value)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(task)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(task.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Kanban;