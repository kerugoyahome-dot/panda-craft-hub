
-- ========================================
-- UNIFIED STATUS ENGINE
-- ========================================
CREATE TYPE public.unified_status AS ENUM (
  'draft',
  'submitted', 
  'under_review',
  'approved',
  'in_progress',
  'completed',
  'rejected',
  'archived'
);

-- ========================================
-- AUDIT TRAIL / ACTIVITY LOGS
-- ========================================
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  department TEXT,
  action_type TEXT NOT NULL, -- create, edit, delete, approve, reject, view_secret, restore, transfer
  entity_type TEXT NOT NULL, -- project, proposal, document, design, transaction, notification, etc.
  entity_id UUID,
  entity_name TEXT,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Department members can view their department logs
CREATE POLICY "Users can view department audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.department_type::text = audit_logs.department
    )
  );

-- Authenticated users can create audit log entries
CREATE POLICY "Users can create audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for common queries
CREATE INDEX idx_audit_logs_entity ON public.audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs (user_id, created_at DESC);
CREATE INDEX idx_audit_logs_department ON public.audit_logs (department, created_at DESC);
CREATE INDEX idx_audit_logs_created ON public.audit_logs (created_at DESC);

-- ========================================
-- NOTIFICATION CENTER
-- ========================================
CREATE TYPE public.notification_priority AS ENUM (
  'critical',
  'action_required',
  'informational'
);

CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority notification_priority NOT NULL DEFAULT 'informational',
  category TEXT NOT NULL DEFAULT 'general', -- approval, financial, project, document, system, handover
  department TEXT,
  entity_type TEXT, -- what this notification relates to
  entity_id UUID,
  deep_link TEXT, -- route to navigate to
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_handled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  handled_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- System/users can create notifications for anyone
CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own notifications (mark read/handled)
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user ON public.notifications (user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_dept ON public.notifications (department, created_at DESC);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
