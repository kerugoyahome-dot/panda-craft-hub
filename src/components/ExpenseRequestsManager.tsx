import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Building
} from "lucide-react";

interface ExpenseRequest {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  requesting_department: string;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  advertising_asset_id: string | null;
  requested_by: string;
  created_at: string;
}

export const ExpenseRequestsManager = () => {
  const { user, isAdmin } = useAuth();
  const [requests, setRequests] = useState<ExpenseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ExpenseRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchRequests();
    
    const channel = supabase
      .channel("expense-requests-realtime")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "expense_requests"
      }, () => fetchRequests())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("expense_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching expense requests:", error);
      toast.error("Failed to fetch expense requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: ExpenseRequest) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("expense_requests")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq("id", request.id);

      if (error) throw error;

      // Record the transaction in financial_transactions
      await supabase
        .from("financial_transactions")
        .insert({
          amount: request.amount,
          transaction_type: "expense",
          category: "Advertising",
          description: `${request.title} - Approved expense request from ${request.requesting_department}`,
          recorded_by: user.id
        });

      toast.success("Expense request approved and recorded!");
      fetchRequests();
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Failed to approve request");
    }
  };

  const handleReject = async () => {
    if (!user || !selectedRequest) return;

    try {
      const { error } = await supabase
        .from("expense_requests")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason || "No reason provided",
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      toast.success("Expense request rejected");
      setRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason("");
      fetchRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject request");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-cyber-green/20 text-cyber-green border-cyber-green/50"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/50"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const getDepartmentBadge = (dept: string) => {
    const colors: Record<string, string> = {
      advertising: "bg-purple-500/20 text-purple-400 border-purple-500/50",
      developers: "bg-cyber-blue/20 text-cyber-blue border-cyber-blue/50",
      graphic_design: "bg-pink-500/20 text-pink-400 border-pink-500/50",
      management: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50",
      compliance: "bg-orange-500/20 text-orange-400 border-orange-500/50"
    };
    return (
      <Badge className={colors[dept] || "bg-muted text-muted-foreground"}>
        <Building className="w-3 h-3 mr-1" />
        {dept.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const pendingRequests = requests.filter(r => r.status === "pending");
  const processedRequests = requests.filter(r => r.status !== "pending");
  const totalPending = pendingRequests.reduce((sum, r) => sum + r.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-cyber-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-cyber border-2 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400 font-orbitron">{pendingRequests.length}</div>
                <div className="text-xs text-muted-foreground font-share-tech">Pending Requests</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-cyber border-2 border-cyber-green/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyber-green/20">
                <DollarSign className="h-5 w-5 text-cyber-green" />
              </div>
              <div>
                <div className="text-2xl font-bold text-cyber-green font-orbitron">KSH {totalPending.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground font-share-tech">Total Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-cyber border-2 border-cyber-blue/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyber-blue/20">
                <CheckCircle className="h-5 w-5 text-cyber-blue" />
              </div>
              <div>
                <div className="text-2xl font-bold text-cyber-blue font-orbitron">{requests.filter(r => r.status === "approved").length}</div>
                <div className="text-xs text-muted-foreground font-share-tech">Approved</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card className="bg-gradient-cyber border-2 border-yellow-500/30">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-yellow-400 font-orbitron flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              PENDING EXPENSE REQUESTS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRequests.map(request => (
                <div
                  key={request.id}
                  className="p-4 rounded-lg bg-black/50 border border-yellow-500/30"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-bold text-white">{request.title}</h4>
                        {getDepartmentBadge(request.requesting_department)}
                      </div>
                      {request.description && (
                        <p className="text-sm text-muted-foreground mb-2">{request.description}</p>
                      )}
                      <p className="text-xl font-bold text-yellow-400">
                        KSH {request.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Requested: {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request)}
                        className="bg-cyber-green/20 border border-cyber-green text-cyber-green hover:bg-cyber-green/30"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setRejectDialogOpen(true);
                        }}
                        className="bg-red-500/20 border border-red-500 text-red-400 hover:bg-red-500/30"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processed Requests */}
      <Card className="bg-gradient-cyber border-2 border-cyber-blue/30">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-cyber-blue font-orbitron flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            ALL EXPENSE REQUESTS
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No expense requests yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {requests.map(request => (
                <div
                  key={request.id}
                  className="p-4 rounded-lg bg-black/50 border border-cyber-blue/20"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-bold text-white">{request.title}</h4>
                        {getDepartmentBadge(request.requesting_department)}
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-lg font-bold text-cyber-blue">
                        KSH {request.amount.toLocaleString()}
                      </p>
                      {request.rejection_reason && (
                        <p className="text-sm text-red-400 mt-1">
                          Reason: {request.rejection_reason}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{new Date(request.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="bg-cyber-gray border-2 border-red-500/50">
          <DialogHeader>
            <DialogTitle className="text-red-400 font-orbitron">Reject Expense Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Rejecting: <strong className="text-white">{selectedRequest?.title}</strong>
            </p>
            <p className="text-yellow-400 font-bold">
              Amount: KSH {selectedRequest?.amount.toLocaleString()}
            </p>
            <div>
              <label className="text-white text-sm">Rejection Reason</label>
              <Input
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="bg-black/50 border-red-500/30 text-white mt-1"
                placeholder="Provide a reason for rejection..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setRejectDialogOpen(false)}
                className="border-muted-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                className="bg-red-500/20 border border-red-500 text-red-400 hover:bg-red-500/30"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};