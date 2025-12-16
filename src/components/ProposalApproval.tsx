import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Check, X, Clock, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Database } from "@/integrations/supabase/types";

type Proposal = Database["public"]["Tables"]["project_proposals"]["Row"];

export const ProposalApproval = () => {
  const { user, isAdmin } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (user && isAdmin) {
      fetchProposals();
      
      // Subscribe to realtime updates
      const channel = supabase
        .channel("proposals-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "project_proposals" },
          () => fetchProposals()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, isAdmin]);

  const fetchProposals = async () => {
    try {
      const { data, error } = await supabase
        .from("project_proposals")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProposals(data || []);
    } catch (error) {
      console.error("Error fetching proposals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (proposal: Proposal) => {
    try {
      // Update proposal status
      const { error: updateError } = await supabase
        .from("project_proposals")
        .update({
          status: "approved",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", proposal.id);

      if (updateError) throw updateError;

      // Create project from proposal
      const { error: projectError } = await supabase.from("projects").insert({
        name: proposal.title,
        description: proposal.description,
        department: proposal.department_type,
        status: "planning",
        created_by: user?.id,
      });

      if (projectError) throw projectError;

      toast.success("Proposal approved and project created!");
      fetchProposals();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve proposal");
    }
  };

  const handleReject = async () => {
    if (!selectedProposal) return;

    try {
      const { error } = await supabase
        .from("project_proposals")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason || null,
        })
        .eq("id", selectedProposal.id);

      if (error) throw error;

      toast.success("Proposal rejected");
      setRejectDialogOpen(false);
      setSelectedProposal(null);
      setRejectionReason("");
      fetchProposals();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject proposal");
    }
  };

  if (!isAdmin) return null;
  if (loading) return null;
  if (proposals.length === 0) return null;

  return (
    <>
      <div className="p-6 rounded-xl bg-gradient-cyber border-2 border-cyber-blue/30 shadow-cyber-glow">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-cyber-blue" />
          <h3 className="text-lg font-bold text-cyber-blue font-orbitron">PENDING PROPOSALS</h3>
          <Badge className="bg-cyber-blue/20 text-cyber-blue border-cyber-blue/50">
            {proposals.length}
          </Badge>
        </div>
        <div className="space-y-3">
          {proposals.map((proposal) => (
            <div
              key={proposal.id}
              className="p-4 rounded-lg bg-black/50 border border-cyber-blue/20 hover:border-cyber-blue/40 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-cyber-green" />
                    <h4 className="font-bold text-white font-share-tech">{proposal.title}</h4>
                  </div>
                  {proposal.description && (
                    <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                      {proposal.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline" className="border-cyber-green/50 text-cyber-green">
                      {proposal.department_type}
                    </Badge>
                    {proposal.client_name && (
                      <Badge variant="outline" className="border-cyber-blue/50 text-cyber-blue">
                        Client: {proposal.client_name}
                      </Badge>
                    )}
                    {proposal.estimated_hours && (
                      <Badge variant="outline" className="border-muted-foreground/50 text-muted-foreground">
                        {proposal.estimated_hours}h
                      </Badge>
                    )}
                    {proposal.estimated_budget && (
                      <Badge variant="outline" className="border-muted-foreground/50 text-muted-foreground">
                        ${proposal.estimated_budget}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(proposal)}
                    className="bg-cyber-green/20 text-cyber-green border border-cyber-green/50 hover:bg-cyber-green/30"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedProposal(proposal);
                      setRejectDialogOpen(true);
                    }}
                    className="bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="bg-cyber-gray border-2 border-red-500/50">
          <DialogHeader>
            <DialogTitle className="text-red-400 font-orbitron">REJECT PROPOSAL</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to reject "{selectedProposal?.title}"?
            </p>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              className="bg-black/50 border-red-500/30 text-white"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
