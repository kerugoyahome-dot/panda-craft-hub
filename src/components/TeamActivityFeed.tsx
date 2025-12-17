import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Activity {
  id: string;
  user_id: string;
  activity_type: string;
  description: string;
  project_id: string | null;
  created_at: string;
  user_name?: string;
  user_initials?: string;
}

export const TeamActivityFeed = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();

    // Set up realtime subscription
    const channel = supabase
      .channel("team-activity-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "team_activity",
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("team_activity")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Fetch user names
      const activitiesWithNames = await Promise.all(
        (data || []).map(async (activity) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", activity.user_id)
            .single();
          const fullName = profile?.full_name || "Unknown User";
          const initials = fullName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
          return { ...activity, user_name: fullName, user_initials: initials };
        })
      );

      setActivities(activitiesWithNames);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "design":
        return "🎨";
      case "commit":
        return "💻";
      case "proposal":
        return "📋";
      case "message":
        return "💬";
      case "project":
        return "📁";
      case "document":
        return "📄";
      default:
        return "⚡";
    }
  };

  if (loading) {
    return (
      <div className="p-6 rounded-xl bg-gradient-cyber border-2 border-cyber-green/30 relative overflow-hidden">
        <h3 className="text-lg font-bold mb-4 font-orbitron text-cyber-green">TEAM ACTIVITY</h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-cyber-gray" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-cyber-gray rounded w-24" />
                <div className="h-2 bg-cyber-gray rounded w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl bg-gradient-cyber border-2 border-cyber-green/30 relative overflow-hidden">
      {/* Scan line effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyber-green/5 to-transparent animate-pulse" />

      <h3 className="text-lg font-bold mb-4 font-orbitron text-cyber-green">TEAM ACTIVITY</h3>
      <div className="space-y-3 text-sm">
        {activities.length === 0 ? (
          <p className="text-muted-foreground font-share-tech text-center py-4">
            No recent activity
          </p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 relative z-10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyber-blue/30 to-cyber-green/30 flex items-center justify-center text-xs font-bold border border-cyber-blue text-cyber-blue">
                {activity.user_initials}
              </div>
              <div className="flex-1">
                <p className="font-medium font-share-tech text-white">
                  {activity.user_name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {getActivityIcon(activity.activity_type)} {activity.description}
                </p>
              </div>
              <span className="text-xs text-cyber-green font-share-tech">
                {getTimeAgo(activity.created_at)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
