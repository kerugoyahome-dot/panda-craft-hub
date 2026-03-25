import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PresenceIndicator } from "@/components/PresenceIndicator";
import { usePresence } from "@/hooks/usePresence";
import { Users } from "lucide-react";

interface TeamMemberProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  department: string | null;
  department_type: string | null;
}

export const OnlineTeamWidget = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMemberProfile[]>([]);
  const { onlineUsers, isOnline } = usePresence();

  useEffect(() => { fetchTeamMembers(); }, []);

  const fetchTeamMembers = async () => {
    try {
      const { data: userRoles } = await supabase.from("user_roles").select("user_id").in("role", ["admin", "team"]);
      if (userRoles && userRoles.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url, department, department_type").in("id", userRoles.map((r) => r.user_id));
        setTeamMembers(profiles || []);
      }
    } catch (error) { console.error("Error fetching team members:", error); }
  };

  const onlineMembers = teamMembers.filter((m) => isOnline(m.id));
  const offlineMembers = teamMembers.filter((m) => !isOnline(m.id));
  const getDepartmentLabel = (dept: string | null) => {
    const labels: Record<string, string> = { financial: "Finance", graphic_design: "Design", developers: "Dev", advertising: "Ads", compliance: "Compliance", management: "Mgmt", records_management: "Records" };
    return dept ? labels[dept] || dept : null;
  };

  return (
    <div className="p-6 rounded-xl bg-card border border-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground font-playfair flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Team Status
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-green-600 text-sm font-medium">{onlineMembers.length} Online</span>
          <PresenceIndicator isOnline={true} size="sm" />
        </div>
      </div>

      {onlineMembers.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Active Now</p>
          <div className="flex flex-wrap gap-3">
            {onlineMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {member.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5"><PresenceIndicator isOnline={true} size="sm" /></div>
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">{member.full_name || "Unknown"}</p>
                  {member.department_type && <p className="text-[10px] text-muted-foreground">{getDepartmentLabel(member.department_type)}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {offlineMembers.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Offline ({offlineMembers.length})</p>
          <div className="flex flex-wrap gap-2">
            {offlineMembers.slice(0, 6).map((member) => (
              <Avatar key={member.id} className="h-8 w-8 opacity-50" title={member.full_name || "Unknown"}>
                <AvatarImage src={member.avatar_url || undefined} />
                <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                  {member.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            ))}
            {offlineMembers.length > 6 && (
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-xs text-muted-foreground">+{offlineMembers.length - 6}</div>
            )}
          </div>
        </div>
      )}

      {teamMembers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No team members found</p>}
    </div>
  );
};
