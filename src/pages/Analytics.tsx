import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Download, TrendingUp, Users, FolderKanban, FileText } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsData {
  projectsByStatus: { name: string; value: number }[];
  tasksByPriority: { name: string; value: number }[];
  monthlyActivity: { month: string; projects: number; clients: number; tasks: number }[];
  teamPerformance: { name: string; completed: number; pending: number }[];
}

const COLORS = {
  primary: "hsl(191, 100%, 50%)",
  secondary: "hsl(120, 100%, 40%)",
  tertiary: "hsl(191, 100%, 65%)",
  quaternary: "hsl(120, 100%, 55%)",
};

const Analytics = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData>({
    projectsByStatus: [],
    tasksByPriority: [],
    monthlyActivity: [],
    teamPerformance: [],
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch projects by status
      const { data: projects } = await supabase.from("projects").select("status");
      const projectsByStatus = projects?.reduce((acc: any, project) => {
        const status = project.status || "unknown";
        const existing = acc.find((item: any) => item.name === status);
        if (existing) {
          existing.value += 1;
        } else {
          acc.push({ name: status, value: 1 });
        }
        return acc;
      }, []) || [];

      // Fetch tasks by priority
      const { data: tasks } = await supabase.from("tasks").select("priority");
      const tasksByPriority = tasks?.reduce((acc: any, task) => {
        const priority = task.priority || "unknown";
        const existing = acc.find((item: any) => item.name === priority);
        if (existing) {
          existing.value += 1;
        } else {
          acc.push({ name: priority, value: 1 });
        }
        return acc;
      }, []) || [];

      // Mock monthly activity data (you can enhance this with real date-based queries)
      const monthlyActivity = [
        { month: "Jan", projects: 5, clients: 8, tasks: 45 },
        { month: "Feb", projects: 7, clients: 10, tasks: 52 },
        { month: "Mar", projects: 6, clients: 12, tasks: 48 },
        { month: "Apr", projects: 9, clients: 15, tasks: 65 },
        { month: "May", projects: 11, clients: 18, tasks: 70 },
        { month: "Jun", projects: 10, clients: 20, tasks: 68 },
      ];

      // Mock team performance data
      const teamPerformance = [
        { name: "John Doe", completed: 42, pending: 8 },
        { name: "Sarah Miller", completed: 38, pending: 12 },
        { name: "Robert Kim", completed: 35, pending: 15 },
        { name: "Emily Chen", completed: 40, pending: 10 },
      ];

      setData({
        projectsByStatus,
        tasksByPriority,
        monthlyActivity,
        teamPerformance,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (dataToExport: any[], filename: string) => {
    if (!dataToExport || dataToExport.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive",
      });
      return;
    }

    const headers = Object.keys(dataToExport[0]);
    const csv = [
      headers.join(","),
      ...dataToExport.map((row) =>
        headers.map((header) => JSON.stringify(row[header] || "")).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `${filename}.csv has been downloaded`,
    });
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(0,191,255,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,191,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,191,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <Navigation />
      <Header />

      <main className="ml-20 pt-16 p-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 animate-slide-up">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-1 w-12 bg-gradient-to-r from-cyber-blue to-cyber-green" />
              <span className="text-cyber-green font-share-tech text-sm tracking-wider">
                ▸ ANALYTICS MODULE LOADED
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyber-blue-glow via-white to-cyber-green-glow bg-clip-text text-transparent font-orbitron">
                  PERFORMANCE ANALYTICS
                </h1>
                <p className="text-cyber-blue font-share-tech">
                  REAL-TIME OPERATIONAL METRICS & INSIGHTS
                </p>
              </div>
              <Button
                onClick={() => exportToCSV(data.monthlyActivity, "analytics-report")}
                className="bg-cyber-blue/20 hover:bg-cyber-blue/30 border-2 border-cyber-blue text-cyber-blue-glow font-share-tech"
              >
                <Download className="w-4 h-4 mr-2" />
                EXPORT DATA
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 bg-gradient-cyber border-2 border-cyber-blue/30 shadow-cyber-glow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-share-tech">TOTAL PROJECTS</p>
                  <h3 className="text-3xl font-bold text-cyber-blue-glow font-orbitron">
                    {data.projectsByStatus.reduce((sum, item) => sum + item.value, 0)}
                  </h3>
                </div>
                <FolderKanban className="w-8 h-8 text-cyber-blue" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-cyber border-2 border-cyber-green/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-share-tech">TOTAL TASKS</p>
                  <h3 className="text-3xl font-bold text-cyber-green font-orbitron">
                    {data.tasksByPriority.reduce((sum, item) => sum + item.value, 0)}
                  </h3>
                </div>
                <FileText className="w-8 h-8 text-cyber-green" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-cyber border-2 border-cyber-blue/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-share-tech">EFFICIENCY</p>
                  <h3 className="text-3xl font-bold text-cyber-blue-glow font-orbitron">92%</h3>
                </div>
                <TrendingUp className="w-8 h-8 text-cyber-blue" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-cyber border-2 border-cyber-green/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-share-tech">TEAM SIZE</p>
                  <h3 className="text-3xl font-bold text-cyber-green font-orbitron">
                    {data.teamPerformance.length}
                  </h3>
                </div>
                <Users className="w-8 h-8 text-cyber-green" />
              </div>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-cyber-gray border border-cyber-blue/30">
              <TabsTrigger value="overview" className="font-share-tech">OVERVIEW</TabsTrigger>
              <TabsTrigger value="projects" className="font-share-tech">PROJECTS</TabsTrigger>
              <TabsTrigger value="tasks" className="font-share-tech">TASKS</TabsTrigger>
              <TabsTrigger value="team" className="font-share-tech">TEAM</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card className="p-6 bg-gradient-cyber border-2 border-cyber-blue/30">
                <h3 className="text-lg font-bold mb-4 text-cyber-blue font-orbitron">
                  MONTHLY ACTIVITY TRENDS
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.monthlyActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,191,255,0.1)" />
                    <XAxis dataKey="month" stroke="rgba(0,191,255,0.5)" />
                    <YAxis stroke="rgba(0,191,255,0.5)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(17, 24, 39, 0.95)",
                        border: "1px solid rgba(0,191,255,0.3)",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="projects"
                      stroke={COLORS.primary}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="clients"
                      stroke={COLORS.secondary}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="tasks"
                      stroke={COLORS.tertiary}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </TabsContent>

            <TabsContent value="projects" className="space-y-6">
              <Card className="p-6 bg-gradient-cyber border-2 border-cyber-blue/30">
                <h3 className="text-lg font-bold mb-4 text-cyber-blue font-orbitron">
                  PROJECTS BY STATUS
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.projectsByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.projectsByStatus.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={Object.values(COLORS)[index % Object.values(COLORS).length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(17, 24, 39, 0.95)",
                        border: "1px solid rgba(0,191,255,0.3)",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-6">
              <Card className="p-6 bg-gradient-cyber border-2 border-cyber-green/30">
                <h3 className="text-lg font-bold mb-4 text-cyber-green font-orbitron">
                  TASKS BY PRIORITY
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.tasksByPriority}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,128,0.1)" />
                    <XAxis dataKey="name" stroke="rgba(0,255,128,0.5)" />
                    <YAxis stroke="rgba(0,255,128,0.5)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(17, 24, 39, 0.95)",
                        border: "1px solid rgba(0,255,128,0.3)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="value" fill={COLORS.secondary} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </TabsContent>

            <TabsContent value="team" className="space-y-6">
              <Card className="p-6 bg-gradient-cyber border-2 border-cyber-blue/30">
                <h3 className="text-lg font-bold mb-4 text-cyber-blue font-orbitron">
                  TEAM PERFORMANCE
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.teamPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,191,255,0.1)" />
                    <XAxis dataKey="name" stroke="rgba(0,191,255,0.5)" />
                    <YAxis stroke="rgba(0,191,255,0.5)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(17, 24, 39, 0.95)",
                        border: "1px solid rgba(0,191,255,0.3)",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="completed" fill={COLORS.secondary} />
                    <Bar dataKey="pending" fill={COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
