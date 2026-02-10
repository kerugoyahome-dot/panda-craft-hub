import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Json } from "@/integrations/supabase/types";

interface AuditLogEntry {
  action_type: string;
  entity_type: string;
  entity_id?: string;
  entity_name?: string;
  description: string;
  department?: string;
  metadata?: Record<string, Json>;
}

export const useAuditLog = () => {
  const { user } = useAuth();

  const logAction = useCallback(
    async (entry: AuditLogEntry) => {
      if (!user) return;

      try {
        const { error } = await supabase.from("audit_logs").insert([{
          user_id: user.id,
          action_type: entry.action_type,
          entity_type: entry.entity_type,
          entity_id: entry.entity_id,
          entity_name: entry.entity_name,
          description: entry.description,
          department: entry.department,
          metadata: entry.metadata || {},
        }]);

        if (error) console.error("Audit log error:", error);
      } catch (err) {
        console.error("Failed to write audit log:", err);
      }
    },
    [user]
  );

  return { logAction };
};
