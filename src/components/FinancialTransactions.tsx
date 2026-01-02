import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Plus, TrendingUp, FileText, Pencil, Trash2 } from "lucide-react";

interface Transaction {
  id: string;
  transaction_type: string;
  category: string;
  amount: number;
  description: string | null;
  client_name: string | null;
  transaction_date: string;
  created_at: string;
}

const categoryLabels: Record<string, string> = {
  software_development: "Software Development",
  web_design: "Web Design",
  school_management_system: "School Management System",
  pos_system: "POS System",
  it_consultation: "IT Consultation",
  graphic_design: "Graphic Design",
  other: "Other",
};

export const FinancialTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState({
    transaction_type: "payment",
    category: "software_development",
    amount: "",
    description: "",
    client_name: "",
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();

    const channel = supabase
      .channel("financial-transactions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "financial_transactions",
        },
        () => fetchTransactions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("financial_transactions")
        .select("*")
        .order("transaction_date", { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.amount) return;

    try {
      if (editingTransaction) {
        const { error } = await supabase
          .from("financial_transactions")
          .update({
            transaction_type: formData.transaction_type,
            category: formData.category,
            amount: parseFloat(formData.amount),
            description: formData.description || null,
            client_name: formData.client_name || null,
          })
          .eq("id", editingTransaction.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Transaction updated successfully",
        });
      } else {
        const { error } = await supabase.from("financial_transactions").insert([
          {
            transaction_type: formData.transaction_type,
            category: formData.category,
            amount: parseFloat(formData.amount),
            description: formData.description || null,
            client_name: formData.client_name || null,
            recorded_by: user.id,
          },
        ]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Transaction recorded successfully",
        });
      }

      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      transaction_type: transaction.transaction_type,
      category: transaction.category,
      amount: String(transaction.amount),
      description: transaction.description || "",
      client_name: transaction.client_name || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      const { error } = await supabase
        .from("financial_transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      transaction_type: "payment",
      category: "software_development",
      amount: "",
      description: "",
      client_name: "",
    });
    setEditingTransaction(null);
    setDialogOpen(false);
  };

  const formatKSH = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const revenueByCategory = transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-cyber-gray/50 border-2 border-cyber-green/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyber-green/20">
                <DollarSign className="h-6 w-6 text-cyber-green" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-share-tech">TOTAL REVENUE</p>
                <p className="text-2xl font-bold text-cyber-green font-orbitron">
                  {formatKSH(totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-cyber-gray/50 border-2 border-cyber-blue/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyber-blue/20">
                <FileText className="h-6 w-6 text-cyber-blue" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-share-tech">TRANSACTIONS</p>
                <p className="text-2xl font-bold text-cyber-blue font-orbitron">
                  {transactions.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-cyber-gray/50 border-2 border-cyber-blue/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyber-blue/20">
                <TrendingUp className="h-6 w-6 text-cyber-blue" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-share-tech">TOP CATEGORY</p>
                <p className="text-sm font-bold text-cyber-blue font-share-tech">
                  {Object.entries(revenueByCategory).sort((a, b) => b[1] - a[1])[0]?.[0]
                    ? categoryLabels[Object.entries(revenueByCategory).sort((a, b) => b[1] - a[1])[0][0]]
                    : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Transaction Button */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        setDialogOpen(open);
      }}>
        <DialogTrigger asChild>
          <Button className="bg-cyber-green/20 border-2 border-cyber-green text-cyber-green hover:bg-cyber-green/30 font-share-tech">
            <Plus className="h-4 w-4 mr-2" />
            RECORD TRANSACTION
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-cyber-gray border-2 border-cyber-green/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-cyber-green font-orbitron">
              {editingTransaction ? "EDIT TRANSACTION" : "RECORD TRANSACTION"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-cyber-green font-share-tech">TYPE</Label>
                <Select
                  value={formData.transaction_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, transaction_type: value })
                  }
                >
                  <SelectTrigger className="bg-cyber-gray/50 border-cyber-green/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-cyber-gray border-cyber-green/30">
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="sale">Sale</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-cyber-green font-share-tech">CATEGORY</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger className="bg-cyber-gray/50 border-cyber-green/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-cyber-gray border-cyber-green/30">
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-cyber-green font-share-tech">AMOUNT (KSH)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="bg-cyber-gray/50 border-cyber-green/30"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-cyber-green font-share-tech">CLIENT NAME</Label>
              <Input
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                className="bg-cyber-gray/50 border-cyber-green/30"
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-cyber-green font-share-tech">DESCRIPTION</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-cyber-gray/50 border-cyber-green/30"
                placeholder="Optional"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-cyber-green/20 border-2 border-cyber-green text-cyber-green hover:bg-cyber-green/30 font-share-tech"
            >
              {editingTransaction ? "UPDATE TRANSACTION" : "RECORD TRANSACTION"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transactions List */}
      <Card className="bg-cyber-gray/50 border-2 border-cyber-blue/30">
        <CardHeader>
          <CardTitle className="text-lg font-orbitron text-cyber-blue">
            RECENT TRANSACTIONS
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : transactions.length === 0 ? (
            <p className="text-center text-muted-foreground font-share-tech py-8">
              No transactions recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-4 rounded-lg bg-black/30 border border-cyber-blue/20 hover:border-cyber-blue/40 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-cyber-green border-cyber-green/50">
                          {categoryLabels[transaction.category]}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {transaction.transaction_type}
                        </Badge>
                      </div>
                      {transaction.client_name && (
                        <p className="text-sm text-white font-share-tech">
                          {transaction.client_name}
                        </p>
                      )}
                      {transaction.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {transaction.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(transaction.transaction_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-bold text-cyber-green font-orbitron">
                        {formatKSH(Number(transaction.amount))}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(transaction)}
                        className="text-cyber-blue hover:text-cyber-blue-glow"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
