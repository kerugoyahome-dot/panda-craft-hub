import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  FileText,
  DollarSign,
  Users,
  Activity,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type DepartmentType = Database["public"]["Enums"]["department_type"];

interface DepartmentAnalyticsProps {
  department?: DepartmentType;
  showAll?: boolean;
}

const departmentLabels: Record<DepartmentType, string> = {
  financial: "Financial",
  graphic_design: "Graphic Design",
  developers: "Developers",
  advertising: "Advertising",
  compliance: "Compliance",
  management: "Management",
  records_management: "Records Management",
};

const COLORS = ["#00bfff", "#00ff88", "#ffcc00", "#ff6b6b", "#a855f7", "#22d3ee", "#f97316"];

const chartConfig: ChartConfig = {
  completed: { label: "Completed", color: "hsl(150 70% 50%)" },
  inProgress: { label: "In Progress", color: "hsl(200 100% 50%)" },
  planning: { label: "Planning", color: "hsl(45 100% 50%)" },
  review: { label: "Review", color: "hsl(280 70% 60%)" },
  documents: { label: "Documents", color: "hsl(200 100% 50%)" },
  designs: { label: "Designs", color: "hsl(150 70% 50%)" },
  income: { label: "Income", color: "hsl(150 70% 50%)" },
  expense: { label: "Expense", color: "hsl(0 84% 60%)" },
};

export const DepartmentAnalytics = ({ department, showAll = false }: DepartmentAnalyticsProps) => {
  const [loading, setLoading] = useState(true);
  const [projectStats, setProjectStats] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [documentUploads, setDocumentUploads] = useState<any[]>([]);
  const [expenseTrends, setExpenseTrends] = useState<any[]>([]);
  const [teamProductivity, setTeamProductivity] = useState<any[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    totalDocuments: 0,
    totalExpenses: 0,
    totalIncome: 0,
    teamMembers: 0,
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [department, showAll]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch projects
      let projectQuery = supabase.from("projects").select("*");
      if (!showAll && department) {
        projectQuery = projectQuery.eq("department", department);
      }
      const { data: projects } = await projectQuery;

      // Calculate project status distribution
      const statusCounts: Record<string, number> = {
        planning: 0,
        "in-progress": 0,
        in_progress: 0,
        review: 0,
        completed: 0,
        submitted: 0,
      };
      (projects || []).forEach((p) => {
        if (p.status && statusCounts[p.status] !== undefined) {
          statusCounts[p.status]++;
        }
      });

      setStatusDistribution([
        { name: "Completed", value: statusCounts.completed, fill: "hsl(150 70% 50%)" },
        { name: "In Progress", value: statusCounts["in-progress"] + statusCounts.in_progress, fill: "hsl(200 100% 50%)" },
        { name: "Planning", value: statusCounts.planning, fill: "hsl(45 100% 50%)" },
        { name: "Review", value: statusCounts.review + statusCounts.submitted, fill: "hsl(280 70% 60%)" },
      ].filter((item) => item.value > 0));

      // Calculate project completion by department
      const deptProjects: Record<string, { total: number; completed: number }> = {};
      (projects || []).forEach((p) => {
        const dept = p.department || "unknown";
        if (!deptProjects[dept]) {
          deptProjects[dept] = { total: 0, completed: 0 };
        }
        deptProjects[dept].total++;
        if (p.status === "completed") {
          deptProjects[dept].completed++;
        }
      });

      const projectStatsData = Object.entries(deptProjects).map(([dept, stats]) => ({
        department: departmentLabels[dept as DepartmentType] || dept,
        total: stats.total,
        completed: stats.completed,
        rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      }));
      setProjectStats(projectStatsData);

      // Fetch documents for upload trends
      let docQuery = supabase.from("documents").select("created_at, created_by");
      if (!showAll && department) {
        const { data: members } = await supabase
          .from("profiles")
          .select("id")
          .eq("department_type", department);
        if (members && members.length > 0) {
          docQuery = docQuery.in("created_by", members.map((m) => m.id));
        }
      }
      const { data: documents } = await docQuery;

      // Fetch designs
      let designQuery = supabase.from("designs").select("created_at, created_by");
      if (!showAll && department) {
        const { data: members } = await supabase
          .from("profiles")
          .select("id")
          .eq("department_type", department);
        if (members && members.length > 0) {
          designQuery = designQuery.in("created_by", members.map((m) => m.id));
        }
      }
      const { data: designs } = await designQuery;

      // Calculate monthly document uploads (last 6 months)
      const monthlyUploads: Record<string, { documents: number; designs: number }> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = date.toLocaleDateString("en-US", { month: "short" });
        monthlyUploads[key] = { documents: 0, designs: 0 };
      }

      (documents || []).forEach((doc) => {
        const date = new Date(doc.created_at);
        const monthDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
        if (monthDiff >= 0 && monthDiff < 6) {
          const key = date.toLocaleDateString("en-US", { month: "short" });
          if (monthlyUploads[key]) {
            monthlyUploads[key].documents++;
          }
        }
      });

      (designs || []).forEach((design) => {
        const date = new Date(design.created_at);
        const monthDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
        if (monthDiff >= 0 && monthDiff < 6) {
          const key = date.toLocaleDateString("en-US", { month: "short" });
          if (monthlyUploads[key]) {
            monthlyUploads[key].designs++;
          }
        }
      });

      setDocumentUploads(
        Object.entries(monthlyUploads).map(([month, counts]) => ({
          month,
          documents: counts.documents,
          designs: counts.designs,
        }))
      );

      // Fetch financial transactions for expense trends
      const { data: transactions } = await supabase
        .from("financial_transactions")
        .select("*")
        .order("transaction_date", { ascending: true });

      // Calculate monthly expense/income trends
      const monthlyFinancials: Record<string, { income: number; expense: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = date.toLocaleDateString("en-US", { month: "short" });
        monthlyFinancials[key] = { income: 0, expense: 0 };
      }

      (transactions || []).forEach((t) => {
        const date = new Date(t.transaction_date);
        const monthDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
        if (monthDiff >= 0 && monthDiff < 6) {
          const key = date.toLocaleDateString("en-US", { month: "short" });
          if (monthlyFinancials[key]) {
            if (t.transaction_type === "income") {
              monthlyFinancials[key].income += Number(t.amount);
            } else {
              monthlyFinancials[key].expense += Number(t.amount);
            }
          }
        }
      });

      setExpenseTrends(
        Object.entries(monthlyFinancials).map(([month, amounts]) => ({
          month,
          income: amounts.income,
          expense: amounts.expense,
        }))
      );

      // Fetch team productivity (projects completed per team member)
      let memberQuery = supabase.from("profiles").select("id, full_name, department_type");
      if (!showAll && department) {
        memberQuery = memberQuery.eq("department_type", department);
      }
      const { data: members } = await memberQuery;

      // Count completed projects per member (as assigned team lead)
      const memberProductivity = await Promise.all(
        (members || []).slice(0, 8).map(async (member) => {
          const { count: completedCount } = await supabase
            .from("projects")
            .select("*", { count: "exact", head: true })
            .eq("assigned_team_id", member.id)
            .eq("status", "completed");

          const { count: totalCount } = await supabase
            .from("projects")
            .select("*", { count: "exact", head: true })
            .eq("assigned_team_id", member.id);

          const { count: docCount } = await supabase
            .from("documents")
            .select("*", { count: "exact", head: true })
            .eq("created_by", member.id);

          return {
            name: member.full_name?.split(" ")[0] || "Unknown",
            completed: completedCount || 0,
            total: totalCount || 0,
            documents: docCount || 0,
          };
        })
      );

      setTeamProductivity(memberProductivity.filter((m) => m.total > 0 || m.documents > 0));

      // Calculate summary stats
      const totalIncome = (transactions || [])
        .filter((t) => t.transaction_type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const totalExpenses = (transactions || [])
        .filter((t) => t.transaction_type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      setSummaryStats({
        totalProjects: projects?.length || 0,
        completedProjects: statusCounts.completed,
        totalDocuments: (documents?.length || 0) + (designs?.length || 0),
        totalExpenses,
        totalIncome,
        teamMembers: members?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-cyber border-2 border-cyber-blue/30">
        <CardContent className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 text-cyber-blue animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const completionRate =
    summaryStats.totalProjects > 0
      ? Math.round((summaryStats.completedProjects / summaryStats.totalProjects) * 100)
      : 0;

  return (
    <Card className="bg-gradient-cyber border-2 border-cyber-blue/30 shadow-cyber-glow">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="text-xl font-orbitron text-cyber-blue flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            {showAll ? "ORGANIZATION ANALYTICS" : "DEPARTMENT ANALYTICS"}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-cyber-green border-cyber-green/50">
              {completionRate}% Completion Rate
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-black/50 border border-cyber-blue/30 text-center">
            <div className="text-2xl font-bold text-cyber-blue font-orbitron">
              {summaryStats.totalProjects}
            </div>
            <div className="text-xs text-muted-foreground">Total Projects</div>
          </div>
          <div className="p-4 rounded-lg bg-black/50 border border-cyber-green/30 text-center">
            <CheckCircle className="h-4 w-4 text-cyber-green mx-auto mb-1" />
            <div className="text-2xl font-bold text-cyber-green font-orbitron">
              {summaryStats.completedProjects}
            </div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="p-4 rounded-lg bg-black/50 border border-purple-500/30 text-center">
            <FileText className="h-4 w-4 text-purple-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-purple-400 font-orbitron">
              {summaryStats.totalDocuments}
            </div>
            <div className="text-xs text-muted-foreground">Documents</div>
          </div>
          <div className="p-4 rounded-lg bg-black/50 border border-green-500/30 text-center">
            <TrendingUp className="h-4 w-4 text-green-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-green-400 font-orbitron">
              {(summaryStats.totalIncome / 1000).toFixed(0)}K
            </div>
            <div className="text-xs text-muted-foreground">Income (KSH)</div>
          </div>
          <div className="p-4 rounded-lg bg-black/50 border border-red-500/30 text-center">
            <DollarSign className="h-4 w-4 text-red-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-red-400 font-orbitron">
              {(summaryStats.totalExpenses / 1000).toFixed(0)}K
            </div>
            <div className="text-xs text-muted-foreground">Expenses (KSH)</div>
          </div>
          <div className="p-4 rounded-lg bg-black/50 border border-cyan-500/30 text-center">
            <Users className="h-4 w-4 text-cyan-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-cyan-400 font-orbitron">
              {summaryStats.teamMembers}
            </div>
            <div className="text-xs text-muted-foreground">Team Members</div>
          </div>
        </div>

        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="bg-black/50 border border-cyber-blue/30 mb-4 flex-wrap h-auto">
            <TabsTrigger value="projects" className="data-[state=active]:bg-cyber-blue/20">
              <Activity className="h-4 w-4 mr-2" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-cyber-blue/20">
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="financial" className="data-[state=active]:bg-cyber-blue/20">
              <DollarSign className="h-4 w-4 mr-2" />
              Financial
            </TabsTrigger>
            <TabsTrigger value="productivity" className="data-[state=active]:bg-cyber-blue/20">
              <Users className="h-4 w-4 mr-2" />
              Productivity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Distribution Pie Chart */}
              <div className="p-4 rounded-lg bg-black/50 border border-cyber-blue/20">
                <h3 className="text-sm font-semibold text-cyber-blue mb-4 font-orbitron">
                  PROJECT STATUS DISTRIBUTION
                </h3>
                {statusDistribution.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[250px]">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    No project data available
                  </div>
                )}
              </div>

              {/* Completion Rate by Department */}
              <div className="p-4 rounded-lg bg-black/50 border border-cyber-blue/20">
                <h3 className="text-sm font-semibold text-cyber-blue mb-4 font-orbitron">
                  COMPLETION RATE BY DEPARTMENT
                </h3>
                {projectStats.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[250px]">
                    <BarChart data={projectStats} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(200 100% 50% / 0.1)" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="department" type="category" width={80} tick={{ fontSize: 10 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="rate" fill="hsl(150 70% 50%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    No department data available
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <div className="p-4 rounded-lg bg-black/50 border border-cyber-blue/20">
              <h3 className="text-sm font-semibold text-cyber-blue mb-4 font-orbitron">
                DOCUMENT UPLOADS (LAST 6 MONTHS)
              </h3>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <AreaChart data={documentUploads}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(200 100% 50% / 0.1)" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="documents"
                    stackId="1"
                    stroke="hsl(200 100% 50%)"
                    fill="hsl(200 100% 50% / 0.5)"
                  />
                  <Area
                    type="monotone"
                    dataKey="designs"
                    stackId="1"
                    stroke="hsl(150 70% 50%)"
                    fill="hsl(150 70% 50% / 0.5)"
                  />
                  <Legend />
                </AreaChart>
              </ChartContainer>
            </div>
          </TabsContent>

          <TabsContent value="financial">
            <div className="p-4 rounded-lg bg-black/50 border border-cyber-blue/20">
              <h3 className="text-sm font-semibold text-cyber-blue mb-4 font-orbitron">
                INCOME VS EXPENSES (LAST 6 MONTHS) - KSH
              </h3>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <LineChart data={expenseTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(200 100% 50% / 0.1)" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => [`KSH ${value.toLocaleString()}`, ""]}
                  />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="hsl(150 70% 50%)"
                    strokeWidth={2}
                    dot={{ fill: "hsl(150 70% 50%)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    stroke="hsl(0 84% 60%)"
                    strokeWidth={2}
                    dot={{ fill: "hsl(0 84% 60%)" }}
                  />
                  <Legend />
                </LineChart>
              </ChartContainer>
            </div>
          </TabsContent>

          <TabsContent value="productivity">
            <div className="p-4 rounded-lg bg-black/50 border border-cyber-blue/20">
              <h3 className="text-sm font-semibold text-cyber-blue mb-4 font-orbitron">
                TEAM PRODUCTIVITY
              </h3>
              {teamProductivity.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <BarChart data={teamProductivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(200 100% 50% / 0.1)" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="completed" fill="hsl(150 70% 50%)" name="Completed Projects" />
                    <Bar dataKey="documents" fill="hsl(200 100% 50%)" name="Documents Created" />
                    <Legend />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No productivity data available
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
