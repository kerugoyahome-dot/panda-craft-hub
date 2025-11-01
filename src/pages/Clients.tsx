import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    status: "active",
    notes: "",
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingClient) {
      const { error } = await supabase
        .from("clients")
        .update(formData)
        .eq("id", editingClient.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update client",
          variant: "destructive",
        });
      } else {
        toast({ title: "Success", description: "Client updated successfully" });
        fetchClients();
        handleCloseDialog();
      }
    } else {
      const { error } = await supabase
        .from("clients")
        .insert([{ ...formData, created_by: user?.id }]);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create client",
          variant: "destructive",
        });
      } else {
        toast({ title: "Success", description: "Client created successfully" });
        fetchClients();
        handleCloseDialog();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this client?")) return;

    const { error } = await supabase.from("clients").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "Client deleted successfully" });
      fetchClients();
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      company: client.company || "",
      status: client.status,
      notes: client.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingClient(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      status: "active",
      notes: "",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "inactive":
        return "secondary";
      case "lead":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-cyber-gray/10 to-background">
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/")}
              className="hover:bg-cyber-blue/10"
            >
              <Home className="h-5 w-5 text-cyber-blue" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold font-orbitron text-cyber-blue-glow mb-2">
                CLIENT DATABASE
              </h1>
              <p className="text-muted-foreground font-share-tech">
                Manage all client information and status
              </p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => setEditingClient(null)}
                className="bg-cyber-blue/20 border-2 border-cyber-blue text-cyber-blue hover:bg-cyber-blue/30 font-share-tech shadow-[0_0_20px_rgba(0,191,255,0.3)]"
              >
                <Plus className="mr-2 h-4 w-4" />
                ADD CLIENT
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-cyber-gray border-2 border-cyber-blue/30">
              <DialogHeader>
                <DialogTitle className="font-orbitron text-cyber-blue">
                  {editingClient ? "EDIT CLIENT" : "ADD NEW CLIENT"}
                </DialogTitle>
              </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingClient ? "Update" : "Create"}
                </Button>
              </div>
            </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-cyber-gray/50 border-2 border-cyber-blue/30 shadow-[0_0_30px_rgba(0,191,255,0.1)]">
          <CardHeader>
            <CardTitle className="font-orbitron text-cyber-blue">
              ALL CLIENTS ({clients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-cyber-blue font-share-tech">
                LOADING CLIENT DATABASE...
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground font-share-tech">
                NO CLIENTS FOUND - ADD YOUR FIRST CLIENT
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-cyber-blue/30">
                    <TableHead className="font-share-tech text-cyber-blue">NAME</TableHead>
                    <TableHead className="font-share-tech text-cyber-blue">COMPANY</TableHead>
                    <TableHead className="font-share-tech text-cyber-blue">EMAIL</TableHead>
                    <TableHead className="font-share-tech text-cyber-blue">PHONE</TableHead>
                    <TableHead className="font-share-tech text-cyber-blue">STATUS</TableHead>
                    <TableHead className="font-share-tech text-cyber-blue">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id} className="border-cyber-blue/20">
                      <TableCell className="font-medium text-white font-share-tech">
                        {client.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {client.company || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {client.email || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {client.phone || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(client.status)} className="font-share-tech">
                          {client.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(client)}
                            className="hover:bg-cyber-blue/10 hover:text-cyber-blue"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(client.id)}
                            className="hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Clients;