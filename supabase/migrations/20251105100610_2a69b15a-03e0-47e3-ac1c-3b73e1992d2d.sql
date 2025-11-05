-- Update projects RLS policy for clients to only see assigned projects
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;

CREATE POLICY "Users can view their own projects"
ON projects FOR SELECT
USING (
  -- Admins can see all
  has_role(auth.uid(), 'admin') OR
  -- Team members can see assigned projects
  (has_role(auth.uid(), 'team') AND (
    auth.uid() = assigned_team_id OR
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_lead_id = projects.assigned_team_id 
      AND member_id = auth.uid()
    )
  )) OR
  -- Clients can ONLY see projects where they are the client
  (has_role(auth.uid(), 'client') AND EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = projects.client_id 
    AND clients.created_by = auth.uid()
  ))
);

-- Update documents RLS to allow clients to see their project documents
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;

CREATE POLICY "Users can view their own documents"
ON documents FOR SELECT
USING (
  auth.uid() = created_by OR 
  has_role(auth.uid(), 'admin') OR
  -- Clients can see documents linked to their projects
  (has_role(auth.uid(), 'client') AND EXISTS (
    SELECT 1 FROM projects p
    JOIN clients c ON p.client_id = c.id
    WHERE p.id = documents.project_id
    AND c.created_by = auth.uid()
  ))
);

-- Update designs RLS to allow clients to see their project designs
DROP POLICY IF EXISTS "Everyone can view designs" ON designs;

CREATE POLICY "Users can view designs"
ON designs FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  auth.uid() = created_by OR
  -- Clients can see designs linked to their projects
  (has_role(auth.uid(), 'client') AND EXISTS (
    SELECT 1 FROM projects p
    JOIN clients c ON p.client_id = c.id
    WHERE p.id = designs.project_id
    AND c.created_by = auth.uid()
  ))
);