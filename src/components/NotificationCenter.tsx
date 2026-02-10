import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";

const priorityConfig = {
  critical: {
    icon: AlertTriangle,
    color: "text-destructive",
    bg: "bg-destructive/10 border-destructive/30",
    label: "Critical",
  },
  action_required: {
    icon: AlertCircle,
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/30",
    label: "Action Required",
  },
  informational: {
    icon: Info,
    color: "text-primary",
    bg: "bg-primary/10 border-primary/30",
    label: "Info",
  },
};

export const NotificationCenter = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    markAsHandled,
    deleteNotification,
  } = useNotifications();
  const [filter, setFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "critical") return n.priority === "critical";
    if (filter === "action_required") return n.priority === "action_required";
    return true;
  });

  const handleClick = (n: Notification) => {
    markAsRead(n.id);
    if (n.deep_link) {
      navigate(n.deep_link);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-primary/10 hover:shadow-cyber-glow"
        >
          <Bell className="h-5 w-5 text-primary" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-96 p-0 bg-card border-2 border-primary/30"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-primary/20">
          <h3 className="font-orbitron text-sm text-primary font-bold">
            NOTIFICATIONS
          </h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs text-muted-foreground hover:text-primary"
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                Read all
              </Button>
            )}
          </div>
        </div>

        {/* Filter */}
        <div className="px-4 py-2 border-b border-primary/10">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="h-8 text-xs bg-muted border-primary/20">
              <Filter className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="action_required">Action Required</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        <ScrollArea className="max-h-[400px]">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground font-share-tech text-sm">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No notifications
            </div>
          ) : (
            <div className="divide-y divide-primary/10">
              {filtered.map((n) => {
                const config = priorityConfig[n.priority];
                const Icon = config.icon;
                return (
                  <div
                    key={n.id}
                    className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors ${
                      !n.is_read ? "bg-primary/5" : ""
                    }`}
                    onClick={() => handleClick(n)}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`mt-0.5 p-1.5 rounded-md border ${config.bg}`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm font-medium font-share-tech truncate ${
                              !n.is_read
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {n.title}
                          </p>
                          <div className="flex items-center gap-1 shrink-0">
                            {!n.is_handled &&
                              n.priority !== "informational" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsHandled(n.id);
                                  }}
                                >
                                  <CheckCheck className="w-3 h-3 text-primary" />
                                </Button>
                              )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(n.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(n.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                          {n.category !== "general" && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-4"
                            >
                              {n.category}
                            </Badge>
                          )}
                          {n.is_handled && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-4 text-primary border-primary/30"
                            >
                              Handled
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
