import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { FileText, Check, X, Clock, Loader2 } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type DepartmentType = Database["public"]["Enums"]["department_type"];

interface Proposal {
  id: string;
  title: string;
  description: string | null;
  client_name: string | null;
  estimated_budget: number | null;
  estimated_hours: number | null;
  status: string;
  proposed_by: string;
  created_at: string;
  proposer_name?: string;
}

interface DepartmentProposalsProps {
  department: DepartmentType;
}

export const DepartmentProposals = ({ department }: DepartmentProposalsProps) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchProposals();

    const channel = supabase
      .channel(`department-proposals-${department}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_proposals",
          filter: `department_type=eq.${department}`,
        },
        () => fetchProposals()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [department]);

  const fetchProposals = async () => {
    try {
      const { data, error } = await supabase
        .from("project_proposals")
        .select("*")
        .eq("department_type", department)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Get proposer names
      const proposalsWithNames = await Promise.all(
        (data || []).map(async (proposal) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", proposal.proposed_by)
            .single();
          return { ...proposal, proposer_name: profile?.full_name || "Unknown" };
        })
      );

      setProposals(proposalsWithNames);
    } catch (error) {
      console.error("Error fetching proposals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (proposalId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("project_proposals")
        .update({ 
          status: "approved", 
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", proposalId);

      if (error) throw error;

      toast({ title: "Proposal approved" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleReject = async (proposalId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("project_proposals")
        .update({ status: "rejected" })
        .eq("id", proposalId);

      if (error) throw error;

      toast({ title: "Proposal rejected" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-cyber-green/20 text-cyber-green border-cyber-green/50"><Check className="h-3 w-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/50"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="bg-cyber-gray/50 border-2 border-purple-500/30">
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 text-purple-400 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-cyber-gray/50 border-2 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-lg font-orbitron text-purple-400 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          DEPARTMENT PROPOSALS
        </CardTitle>
      </CardHeader>
      <CardContent>
        {proposals.length === 0 ? (
          <p className="text-center text-muted-foreground font-share-tech py-4">
            No proposals yet
          </p>
        ) : (
          <div className="space-y-3">
            {proposals.map((proposal) => (
              <div
                key={proposal.id}
                className="p-4 rounded-lg bg-black/30 border border-purple-500/20"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-white font-share-tech">{proposal.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      By {proposal.proposer_name} • {new Date(proposal.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(proposal.status)}
                </div>
                {proposal.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {proposal.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  {proposal.client_name && <span>Client: {proposal.client_name}</span>}
                  {proposal.estimated_budget && <span>Budget: ${proposal.estimated_budget}</span>}
                  {proposal.estimated_hours && <span>Hours: {proposal.estimated_hours}h</span>}
                </div>
                {isAdmin && proposal.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(proposal.id)}
                      className="bg-cyber-green/20 text-cyber-green border border-cyber-green/50 hover:bg-cyber-green/30"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(proposal.id)}
                      className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
