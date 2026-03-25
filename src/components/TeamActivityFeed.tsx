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
    const channel = supabase.channel("team-activity-feed").on("postgres_changes", { event: "INSERT", schema: "public", table: "team_activity" }, () => fetchActivities()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase.from("team_activity").select("*").order("created_at", { ascending: false }).limit(10);
      if (error) throw error;
      const activitiesWithNames = await Promise.all(
        (data || []).map(async (activity) => {
          const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", activity.user_id).single();
          const fullName = profile?.full_name || "Unknown User";
          return { ...activity, user_name: fullName, user_initials: fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) };
        })
      );
      setActivities(activitiesWithNames);
    } catch (error) { console.error("Error fetching activities:", error); }
    finally { setLoading(false); }
  };

  const getTimeAgo = (dateString: string) => {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(diffMs / 3600000);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(diffMs / 86400000)}d ago`;
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = { design: "🎨", commit: "💻", proposal: "📋", message: "💬", project: "📁", document: "📄" };
    return icons[type] || "⚡";
  };

  if (loading) {
    return (
      <div className="p-6 rounded-xl bg-card border border-border shadow-sm">
        <h3 className="text-lg font-semibold mb-4 font-playfair text-foreground">Team Activity</h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div className="flex-1 space-y-2"><div className="h-3 bg-muted rounded w-24" /><div className="h-2 bg-muted rounded w-32" /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl bg-card border border-border shadow-sm">
      <h3 className="text-lg font-semibold mb-4 font-playfair text-foreground">Team Activity</h3>
      <div className="space-y-3 text-sm">
        {activities.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No recent activity</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {activity.user_initials}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{activity.user_name}</p>
                <p className="text-muted-foreground text-xs">{getActivityIcon(activity.activity_type)} {activity.description}</p>
              </div>
              <span className="text-xs text-muted-foreground">{getTimeAgo(activity.created_at)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
