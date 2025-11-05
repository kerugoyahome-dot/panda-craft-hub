-- First, update the app_role enum to include team role
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'team';

-- Add team assignment columns to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS assigned_team_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS product_type text DEFAULT 'web',
ADD COLUMN IF NOT EXISTS live_url text,
ADD COLUMN IF NOT EXISTS repository_url text;

-- Create a team_members table to track team composition
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_lead_id uuid REFERENCES auth.users(id) NOT NULL,
  member_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(team_lead_id, member_id)
);

-- Enable RLS on team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for team_members
CREATE POLICY "Team members can view their team"
ON team_members FOR SELECT
USING (
  auth.uid() = team_lead_id OR 
  auth.uid() = member_id OR 
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can manage team members"
ON team_members FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Update projects RLS to allow team access
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
CREATE POLICY "Users can view their own projects"
ON projects FOR SELECT
USING (
  auth.uid() = created_by OR 
  auth.uid() = assigned_team_id OR
  EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_lead_id = projects.assigned_team_id 
    AND member_id = auth.uid()
  ) OR
  has_role(auth.uid(), 'admin')
);

-- Update projects update policy for teams
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
CREATE POLICY "Users can update their own projects"
ON projects FOR UPDATE
USING (
  auth.uid() = created_by OR 
  auth.uid() = assigned_team_id OR
  EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_lead_id = projects.assigned_team_id 
    AND member_id = auth.uid()
  ) OR
  has_role(auth.uid(), 'admin')
);