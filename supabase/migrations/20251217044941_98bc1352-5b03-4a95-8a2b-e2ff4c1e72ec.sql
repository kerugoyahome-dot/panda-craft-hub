-- Create department_messages table for inter-department chat
CREATE TABLE public.department_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  sender_department department_type NOT NULL,
  recipient_department department_type NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.department_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages from/to their department
CREATE POLICY "Users can view department messages" 
ON public.department_messages 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.department_type = sender_department OR profiles.department_type = recipient_department)
  )
);

-- Policy: Users can send messages from their department
CREATE POLICY "Users can send department messages" 
ON public.department_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.department_type = sender_department
  )
);

-- Policy: Admins can send messages to any department
CREATE POLICY "Admins can send messages" 
ON public.department_messages 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = sender_id
);

-- Policy: Recipients can update read status
CREATE POLICY "Users can update read status" 
ON public.department_messages 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.department_type = recipient_department
  )
);

-- Create team_activity table for tracking real team activities
CREATE TABLE public.team_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on team_activity
ALTER TABLE public.team_activity ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view team activity
CREATE POLICY "Everyone can view team activity" 
ON public.team_activity 
FOR SELECT 
USING (true);

-- Policy: Users can create their own activity
CREATE POLICY "Users can create activity" 
ON public.team_activity 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for department_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.department_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_activity;