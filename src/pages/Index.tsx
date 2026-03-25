import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import RecentProjects from "@/components/RecentProjects";
import { OnlineTeamWidget } from "@/components/OnlineTeamWidget";
import { ProposalApproval } from "@/components/ProposalApproval";
import { TeamActivityFeed } from "@/components/TeamActivityFeed";
import { FloatingChat } from "@/components/FloatingChat";
import { Users, FolderKanban, Palette, TrendingUp } from "lucide-react";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { AddClientDialog } from "@/components/AddClientDialog";
import { UploadDesignDialog } from "@/components/UploadDesignDialog";
import { CreateDocumentDialog } from "@/components/CreateDocumentDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [designDialogOpen, setDesignDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [stats, setStats] = useState({ projects: 0, clients: 0, designs: 0, revenue: 0 });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (user) fetchStats();
  }, [user, refreshKey]);

  const fetchStats = async () => {
    try {
      const [projectsData, clientsData, designsData] = await Promise.all([
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("created_by", user?.id),
        supabase.from("clients").select("id", { count: "exact", head: true }).eq("created_by", user?.id),
        supabase.from("designs").select("id", { count: "exact", head: true }).eq("created_by", user?.id),
      ]);
      setStats({
        projects: projectsData.count || 0,
        clients: clientsData.count || 0,
        designs: designsData.count || 0,
        revenue: 32,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleSuccess = () => setRefreshKey((prev) => prev + 1);

  return (
    <>
      <CreateProjectDialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen} onSuccess={handleSuccess} />
      <AddClientDialog open={clientDialogOpen} onOpenChange={setClientDialogOpen} onSuccess={handleSuccess} />
      <UploadDesignDialog open={designDialogOpen} onOpenChange={setDesignDialogOpen} onSuccess={handleSuccess} />
      <CreateDocumentDialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen} onSuccess={handleSuccess} />

      <div className="min-h-screen bg-background">
        <Navigation />
        <Header />
      
        <main className="ml-20 pt-16 p-8 animate-fade-in">
          <div className="max-w-7xl mx-auto">
            {/* Hero */}
            <div className="mb-10 animate-slide-up">
              <h1 className="text-4xl font-bold mb-2 text-foreground font-playfair">
                Abancool Techs
              </h1>
              <p className="text-muted-foreground text-lg">
                Internal System — Operations Dashboard
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard title="Active Projects" value={stats.projects.toString()} change="Total projects created" icon={FolderKanban} trend="up" />
              <StatCard title="Total Clients" value={stats.clients.toString()} change="Total clients managed" icon={Users} trend="up" />
              <StatCard title="Designs Created" value={stats.designs.toString()} change="Total designs uploaded" icon={Palette} trend="up" />
              <StatCard title="Revenue Growth" value={`${stats.revenue}%`} change="+5% from last quarter" icon={TrendingUp} trend="up" />
            </div>

            {/* Proposals */}
            <div className="mb-8">
              <ProposalApproval />
            </div>

            {/* Projects + Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RecentProjects key={refreshKey} />
              </div>
              
              <div className="space-y-6">
                <div className="p-6 rounded-xl bg-card border border-border shadow-sm">
                  <h3 className="text-lg font-semibold mb-4 text-foreground font-playfair">Quick Actions</h3>
                  <div className="space-y-3">
                    <button onClick={() => setProjectDialogOpen(true)} className="w-full p-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all text-sm">
                      + New Project
                    </button>
                    <button onClick={() => setClientDialogOpen(true)} className="w-full p-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all border border-border text-sm">
                      + Add Client
                    </button>
                    <button onClick={() => setDesignDialogOpen(true)} className="w-full p-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all border border-border text-sm">
                      + Upload Design
                    </button>
                    <button onClick={() => setDocumentDialogOpen(true)} className="w-full p-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all border border-border text-sm">
                      + Create Document
                    </button>
                  </div>
                </div>
                <OnlineTeamWidget />
                <TeamActivityFeed />
              </div>
            </div>
          </div>
        </main>
        <FloatingChat />
      </div>
    </>
  );
};

export default Index;
