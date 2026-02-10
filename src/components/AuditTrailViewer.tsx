import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  RotateCcw,
  ArrowRightLeft,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AuditLog {
  id: string;
  user_id: string;
  department: string | null;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

const actionIcons: Record<string, React.ReactNode> = {
  create: <Plus className="w-3.5 h-3.5" />,
  edit: <Edit className="w-3.5 h-3.5" />,
  delete: <Trash2 className="w-3.5 h-3.5" />,
  approve: <CheckCircle className="w-3.5 h-3.5" />,
  reject: <XCircle className="w-3.5 h-3.5" />,
  view_secret: <Eye className="w-3.5 h-3.5" />,
  restore: <RotateCcw className="w-3.5 h-3.5" />,
  transfer: <ArrowRightLeft className="w-3.5 h-3.5" />,
};

const actionColors: Record<string, string> = {
  create: "text-primary border-primary/30 bg-primary/10",
  edit: "text-amber-500 border-amber-500/30 bg-amber-500/10",
  delete: "text-destructive border-destructive/30 bg-destructive/10",
  approve: "text-green-500 border-green-500/30 bg-green-500/10",
  reject: "text-destructive border-destructive/30 bg-destructive/10",
  view_secret: "text-purple-500 border-purple-500/30 bg-purple-500/10",
  restore: "text-cyan-500 border-cyan-500/30 bg-cyan-500/10",
  transfer: "text-orange-500 border-orange-500/30 bg-orange-500/10",
};

interface AuditTrailViewerProps {
  department?: string;
  entityType?: string;
  entityId?: string;
  limit?: number;
  compact?: boolean;
}

export const AuditTrailViewer = ({
  department,
  entityType,
  entityId,
  limit = 100,
  compact = false,
}: AuditTrailViewerProps) => {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [profiles, setProfiles] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchLogs();

    const channel = supabase
      .channel("audit-logs-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_logs" },
        () => fetchLogs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [department, entityType, entityId]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (department) query = query.eq("department", department);
      if (entityType) query = query.eq("entity_type", entityType);
      if (entityId) query = query.eq("entity_id", entityId);

      const { data, error } = await query;
      if (error) throw error;

      const typed = (data || []) as unknown as AuditLog[];
      setLogs(typed);

      // Fetch profile names
      const userIds = [...new Set(typed.map((l) => l.user_id))];
      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        if (profileData) {
          const map: Record<string, string> = {};
          profileData.forEach((p) => {
            map[p.id] = p.full_name || "Unknown";
          });
          setProfiles(map);
        }
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter((log) => {
    const matchesSearch =
      !search ||
      log.description.toLowerCase().includes(search.toLowerCase()) ||
      log.entity_name?.toLowerCase().includes(search.toLowerCase()) ||
      profiles[log.user_id]?.toLowerCase().includes(search.toLowerCase());
    const matchesAction =
      actionFilter === "all" || log.action_type === actionFilter;
    return matchesSearch && matchesAction;
  });

  if (compact) {
    return (
      <div className="space-y-2">
        {filtered.slice(0, 10).map((log) => (
          <div
            key={log.id}
            className="flex items-center gap-2 text-xs text-muted-foreground p-2 rounded bg-muted/30"
          >
            <div
              className={`p-1 rounded border ${
                actionColors[log.action_type] || "border-muted"
              }`}
            >
              {actionIcons[log.action_type] || (
                <Edit className="w-3.5 h-3.5" />
              )}
            </div>
            <span className="truncate flex-1">{log.description}</span>
            <span className="shrink-0 text-[10px]">
              {formatDistanceToNow(new Date(log.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            No activity recorded yet.
          </p>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-gradient-cyber border-2 border-primary/30">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-bold text-primary font-orbitron flex items-center gap-2">
          <Shield className="w-5 h-5" />
          AUDIT TRAIL
        </CardTitle>
        <Badge variant="outline" className="text-primary border-primary/50">
          {filtered.length} entries
        </Badge>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search logs..."
              className="pl-9 bg-muted border-primary/20 font-share-tech"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-40 bg-muted border-primary/20 font-share-tech">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="edit">Edit</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="approve">Approve</SelectItem>
              <SelectItem value="reject">Reject</SelectItem>
              <SelectItem value="restore">Restore</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Log List */}
        <ScrollArea className="max-h-[500px]">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground font-share-tech">
              Loading audit trail...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground font-share-tech">
              <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
              No audit logs found.
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-primary/10 hover:border-primary/20 transition-colors"
                >
                  <div
                    className={`mt-0.5 p-1.5 rounded-md border ${
                      actionColors[log.action_type] || "border-muted"
                    }`}
                  >
                    {actionIcons[log.action_type] || (
                      <Edit className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-foreground font-share-tech">
                        {profiles[log.user_id] || "Unknown User"}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-4 capitalize"
                      >
                        {log.action_type}
                      </Badge>
                      {log.department && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-4"
                        >
                          {log.department}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {log.description}
                    </p>
                    {log.entity_name && (
                      <p className="text-xs text-primary/70 mt-0.5">
                        {log.entity_type}: {log.entity_name}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(log.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
