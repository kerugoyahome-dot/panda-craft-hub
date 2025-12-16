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

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      // Fetch profiles with team role
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", ["admin", "team"]);

      if (userRoles && userRoles.length > 0) {
        const userIds = userRoles.map((r) => r.user_id);
        
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, department, department_type")
          .in("id", userIds);

        setTeamMembers(profiles || []);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  const onlineMembers = teamMembers.filter((m) => isOnline(m.id));
  const offlineMembers = teamMembers.filter((m) => !isOnline(m.id));

  const getDepartmentLabel = (dept: string | null) => {
    const labels: Record<string, string> = {
      financial: "Finance",
      graphic_design: "Design",
      developers: "Dev",
      advertising: "Ads",
      compliance: "Compliance",
      management: "Mgmt",
    };
    return dept ? labels[dept] || dept : null;
  };

  return (
    <div className="p-6 rounded-xl bg-gradient-cyber border-2 border-cyber-green/30 relative overflow-hidden">
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyber-blue" />
      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyber-blue" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyber-blue" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyber-blue" />

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-cyber-green font-orbitron tracking-wider flex items-center gap-2">
          <Users className="h-5 w-5" />
          TEAM STATUS
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-cyber-green font-share-tech text-sm">
            {onlineMembers.length} ONLINE
          </span>
          <PresenceIndicator isOnline={true} size="sm" />
        </div>
      </div>

      {/* Online Members */}
      {onlineMembers.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-cyber-blue font-share-tech mb-2 tracking-wider">
            ▸ ACTIVE NOW
          </p>
          <div className="flex flex-wrap gap-3">
            {onlineMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2 bg-cyber-blue/10 border border-cyber-green/30 rounded-lg px-3 py-2 hover:bg-cyber-blue/20 transition-all"
              >
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback className="bg-cyber-green/20 text-cyber-green text-xs">
                      {member.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <PresenceIndicator isOnline={true} size="sm" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-white font-share-tech">
                    {member.full_name || "Unknown"}
                  </p>
                  {member.department_type && (
                    <p className="text-[10px] text-cyber-green">
                      {getDepartmentLabel(member.department_type)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Offline Members */}
      {offlineMembers.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground font-share-tech mb-2 tracking-wider">
            ▸ OFFLINE ({offlineMembers.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {offlineMembers.slice(0, 6).map((member) => (
              <div
                key={member.id}
                className="relative"
                title={member.full_name || "Unknown"}
              >
                <Avatar className="h-8 w-8 opacity-50">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback className="bg-cyber-gray text-muted-foreground text-xs">
                    {member.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
            ))}
            {offlineMembers.length > 6 && (
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-cyber-gray text-xs text-muted-foreground">
                +{offlineMembers.length - 6}
              </div>
            )}
          </div>
        </div>
      )}

      {teamMembers.length === 0 && (
        <p className="text-sm text-muted-foreground font-share-tech text-center py-4">
          NO TEAM MEMBERS FOUND
        </p>
      )}
    </div>
  );
};
