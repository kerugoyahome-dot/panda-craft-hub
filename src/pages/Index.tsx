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
  const [stats, setStats] = useState({
    projects: 0,
    clients: 0,
    designs: 0,
    revenue: 0,
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user, refreshKey]);

  const fetchStats = async () => {
    try {
      const [projectsData, clientsData, designsData] = await Promise.all([
        supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("created_by", user?.id),
        supabase
          .from("clients")
          .select("id", { count: "exact", head: true })
          .eq("created_by", user?.id),
        supabase
          .from("designs")
          .select("id", { count: "exact", head: true })
          .eq("created_by", user?.id),
      ]);

      setStats({
        projects: projectsData.count || 0,
        clients: clientsData.count || 0,
        designs: designsData.count || 0,
        revenue: 32, // Keep as placeholder for now
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };
  return (
    <>
      <CreateProjectDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        onSuccess={handleSuccess}
      />
      <AddClientDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        onSuccess={handleSuccess}
      />
      <UploadDesignDialog
        open={designDialogOpen}
        onOpenChange={setDesignDialogOpen}
        onSuccess={handleSuccess}
      />
      <CreateDocumentDialog
        open={documentDialogOpen}
        onOpenChange={setDocumentDialogOpen}
        onSuccess={handleSuccess}
      />

      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(0,191,255,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,191,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,191,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        
        <Navigation />
        <Header />
      
      <main className="ml-20 pt-16 p-8 animate-fade-in relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="mb-12 animate-slide-up">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-1 w-12 bg-gradient-to-r from-cyber-blue to-cyber-green" />
              <span className="text-cyber-green font-share-tech text-sm tracking-wider">▸ SYSTEM STATUS: OPERATIONAL</span>
            </div>
            <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-cyber-blue-glow via-white to-cyber-green-glow bg-clip-text text-transparent font-orbitron">
              JL SOFTWARE & DIGITAL
            </h1>
            <p className="text-cyber-blue font-share-tech text-lg">
              ENTERPRISE CONTROL TERMINAL // SECURE ACCESS GRANTED
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Active Projects"
              value={stats.projects.toString()}
              change="Total projects created"
              icon={FolderKanban}
              trend="up"
            />
            <StatCard
              title="Total Clients"
              value={stats.clients.toString()}
              change="Total clients managed"
              icon={Users}
              trend="up"
            />
            <StatCard
              title="Designs Created"
              value={stats.designs.toString()}
              change="Total designs uploaded"
              icon={Palette}
              trend="up"
            />
            <StatCard
              title="Revenue Growth"
              value={`${stats.revenue}%`}
              change="+5% from last quarter"
              icon={TrendingUp}
              trend="up"
            />
          </div>

          {/* Proposal Approval Section */}
          <div className="mb-8">
            <ProposalApproval />
          </div>

          {/* Recent Projects */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RecentProjects key={refreshKey} />
            </div>
            
            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-gradient-cyber border-2 border-cyber-blue/30 shadow-cyber-glow relative overflow-hidden">
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyber-green" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyber-green" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyber-green" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyber-green" />
                
                <h3 className="text-lg font-bold mb-4 text-cyber-blue font-orbitron tracking-wider">QUICK ACTIONS</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setProjectDialogOpen(true)}
                    className="w-full p-3 rounded-lg bg-cyber-blue/20 text-cyber-blue-glow font-medium hover:bg-cyber-blue/30 transition-all border border-cyber-blue/50 font-share-tech hover:shadow-[0_0_20px_rgba(0,191,255,0.4)]"
                  >
                    + NEW PROJECT
                  </button>
                  <button
                    onClick={() => setClientDialogOpen(true)}
                    className="w-full p-3 rounded-lg bg-cyber-gray hover:bg-cyber-gray-light transition-all border border-cyber-blue/30 text-white font-share-tech hover:shadow-[0_0_15px_rgba(0,191,255,0.2)]"
                  >
                    + ADD CLIENT
                  </button>
                  <button
                    onClick={() => setDesignDialogOpen(true)}
                    className="w-full p-3 rounded-lg bg-cyber-gray hover:bg-cyber-gray-light transition-all border border-cyber-blue/30 text-white font-share-tech hover:shadow-[0_0_15px_rgba(0,191,255,0.2)]"
                  >
                    + UPLOAD DESIGN
                  </button>
                  <button
                    onClick={() => setDocumentDialogOpen(true)}
                    className="w-full p-3 rounded-lg bg-cyber-gray hover:bg-cyber-gray-light transition-all border border-cyber-blue/30 text-white font-share-tech hover:shadow-[0_0_15px_rgba(0,191,255,0.2)]"
                  >
                    + CREATE DOCUMENT
                  </button>
                </div>
              </div>

              {/* Online Team Widget */}
              <OnlineTeamWidget />

              {/* Real Team Activity Feed */}
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
