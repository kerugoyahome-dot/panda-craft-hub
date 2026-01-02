import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, MessageSquare, FolderKanban, FileText, DollarSign, Loader2 } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type DepartmentType = Database["public"]["Enums"]["department_type"];

interface ActivityItem {
  id: string;
  user_id: string;
  activity_type: string;
  description: string;
  created_at: string;
  user_name?: string;
}

interface DepartmentActivityProps {
  department: DepartmentType;
}

export const DepartmentActivity = ({ department }: DepartmentActivityProps) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();

    const channel = supabase
      .channel(`department-activity-${department}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "team_activity",
        },
        () => fetchActivities()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [department]);

  const fetchActivities = async () => {
    try {
      // Get team members in this department
      const { data: members } = await supabase
        .from("profiles")
        .select("id")
        .eq("department_type", department);

      if (!members || members.length === 0) {
        setActivities([]);
        setLoading(false);
        return;
      }

      const memberIds = members.map((m) => m.id);

      // Get activities from department members
      const { data: activityData, error } = await supabase
        .from("team_activity")
        .select("*")
        .in("user_id", memberIds)
        .order("created_at", { ascending: false })
        .limit(15);

      if (error) throw error;

      // Get user names
      const activitiesWithNames = await Promise.all(
        (activityData || []).map(async (activity) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", activity.user_id)
            .single();
          return { ...activity, user_name: profile?.full_name || "Unknown" };
        })
      );

      setActivities(activitiesWithNames);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="h-4 w-4 text-cyber-blue" />;
      case "project":
        return <FolderKanban className="h-4 w-4 text-cyber-green" />;
      case "document":
        return <FileText className="h-4 w-4 text-purple-400" />;
      case "transaction":
        return <DollarSign className="h-4 w-4 text-yellow-400" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <Card className="bg-cyber-gray/50 border-2 border-yellow-500/30">
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 text-yellow-400 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-cyber-gray/50 border-2 border-yellow-500/30">
      <CardHeader>
        <CardTitle className="text-lg font-orbitron text-yellow-400 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          RECENT ACTIVITY
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-center text-muted-foreground font-share-tech py-4">
            No recent activity
          </p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-black/30 border border-yellow-500/20"
              >
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  {getActivityIcon(activity.activity_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-share-tech truncate">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.user_name} • {getTimeAgo(activity.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
