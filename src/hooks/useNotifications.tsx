import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  priority: "critical" | "action_required" | "informational";
  category: string;
  department: string | null;
  entity_type: string | null;
  entity_id: string | null;
  deep_link: string | null;
  is_read: boolean;
  is_handled: boolean;
  created_at: string;
  read_at: string | null;
  handled_at: string | null;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      const typed = (data || []) as unknown as Notification[];
      setNotifications(typed);
      setUnreadCount(typed.filter((n) => !n.is_read).length);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();

    if (!user) return;

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  const markAsRead = useCallback(
    async (id: string) => {
      await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", id);
      fetchNotifications();
    },
    [fetchNotifications]
  );

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("is_read", false);
    fetchNotifications();
  }, [user, fetchNotifications]);

  const markAsHandled = useCallback(
    async (id: string) => {
      await supabase
        .from("notifications")
        .update({
          is_handled: true,
          handled_at: new Date().toISOString(),
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("id", id);
      fetchNotifications();
    },
    [fetchNotifications]
  );

  const deleteNotification = useCallback(
    async (id: string) => {
      await supabase.from("notifications").delete().eq("id", id);
      fetchNotifications();
    },
    [fetchNotifications]
  );

  const sendNotification = useCallback(
    async (params: {
      user_id: string;
      title: string;
      message: string;
      priority?: "critical" | "action_required" | "informational";
      category?: string;
      department?: string;
      entity_type?: string;
      entity_id?: string;
      deep_link?: string;
    }) => {
      const { error } = await supabase.from("notifications").insert({
        user_id: params.user_id,
        title: params.title,
        message: params.message,
        priority: params.priority || "informational",
        category: params.category || "general",
        department: params.department,
        entity_type: params.entity_type,
        entity_id: params.entity_id,
        deep_link: params.deep_link,
      });
      if (error) console.error("Failed to send notification:", error);
    },
    []
  );

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    markAsHandled,
    deleteNotification,
    sendNotification,
    refresh: fetchNotifications,
  };
};
