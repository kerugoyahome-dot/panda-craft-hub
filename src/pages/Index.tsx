import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import RecentProjects from "@/components/RecentProjects";
import { Users, FolderKanban, Palette, TrendingUp } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navigation />
      <Header />
      
      <main className="ml-20 pt-16 p-8 animate-fade-in">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="mb-12 animate-slide-up">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-gold bg-clip-text text-transparent">
              Welcome to Panda Tech Control System
            </h1>
            <p className="text-muted-foreground text-lg">
              Powering the Future of Creative Innovation
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Active Projects"
              value="24"
              change="+12% from last month"
              icon={FolderKanban}
              trend="up"
            />
            <StatCard
              title="Total Clients"
              value="48"
              change="+8% from last month"
              icon={Users}
              trend="up"
            />
            <StatCard
              title="Designs Created"
              value="156"
              change="+23% from last month"
              icon={Palette}
              trend="up"
            />
            <StatCard
              title="Revenue Growth"
              value="32%"
              change="+5% from last quarter"
              icon={TrendingUp}
              trend="up"
            />
          </div>

          {/* Recent Projects */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RecentProjects />
            </div>
            
            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-gradient-card border border-gold/30 shadow-gold">
                <h3 className="text-lg font-bold mb-4 text-gold">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full p-3 rounded-lg bg-gold text-black font-medium hover:bg-gold-dark transition-colors">
                    + New Project
                  </button>
                  <button className="w-full p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                    + Add Client
                  </button>
                  <button className="w-full p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                    + Upload Design
                  </button>
                  <button className="w-full p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                    + Create Document
                  </button>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-gradient-card border border-border">
                <h3 className="text-lg font-bold mb-4">Team Activity</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-xs font-bold text-black">
                      JD
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">John Doe</p>
                      <p className="text-muted-foreground text-xs">Updated design files</p>
                    </div>
                    <span className="text-xs text-muted-foreground">2m ago</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                      SM
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Sarah Miller</p>
                      <p className="text-muted-foreground text-xs">Committed to GitHub</p>
                    </div>
                    <span className="text-xs text-muted-foreground">15m ago</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                      RK
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Robert Kim</p>
                      <p className="text-muted-foreground text-xs">Created new proposal</p>
                    </div>
                    <span className="text-xs text-muted-foreground">1h ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
