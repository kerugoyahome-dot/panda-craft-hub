-- Create financial transactions table
CREATE TABLE public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment', 'sale', 'service')),
  category TEXT NOT NULL CHECK (category IN ('software_development', 'web_design', 'school_management_system', 'pos_system', 'it_consultation', 'graphic_design', 'other')),
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  client_name TEXT,
  project_id UUID REFERENCES public.projects(id),
  recorded_by UUID NOT NULL,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Financial department and admins can view all transactions
CREATE POLICY "Financial and admins can view transactions"
ON public.financial_transactions FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.department_type = 'financial'
  )
);

-- Financial department and admins can create transactions
CREATE POLICY "Financial and admins can create transactions"
ON public.financial_transactions FOR INSERT
WITH CHECK (
  auth.uid() = recorded_by AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.department_type = 'financial'
    )
  )
);

-- Financial department and admins can update transactions
CREATE POLICY "Financial and admins can update transactions"
ON public.financial_transactions FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.department_type = 'financial'
  )
);

-- Add deadline tracking to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deadline_hours INTEGER;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS submission_notes TEXT;

-- Create project submissions table for tracking deliverables
CREATE TABLE public.project_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL,
  file_path TEXT,
  file_name TEXT,
  file_size INTEGER,
  submission_type TEXT NOT NULL CHECK (submission_type IN ('design', 'document', 'code', 'other')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for project_submissions
ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;

-- Users can view submissions for their projects
CREATE POLICY "Users can view project submissions"
ON public.project_submissions FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_submissions.project_id 
    AND (projects.created_by = auth.uid() OR projects.assigned_team_id = auth.uid())
  ) OR
  EXISTS (
    SELECT 1 FROM team_members tm
    JOIN projects p ON p.assigned_team_id = tm.team_lead_id
    WHERE p.id = project_submissions.project_id AND tm.member_id = auth.uid()
  )
);

-- Team members can create submissions
CREATE POLICY "Team members can create submissions"
ON public.project_submissions FOR INSERT
WITH CHECK (
  auth.uid() = submitted_by AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_submissions.project_id 
      AND (projects.assigned_team_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN projects p ON p.assigned_team_id = tm.team_lead_id
      WHERE p.id = project_submissions.project_id AND tm.member_id = auth.uid()
    )
  )
);

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.financial_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_submissions;

-- Create trigger for updated_at
CREATE TRIGGER update_financial_transactions_updated_at
  BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();