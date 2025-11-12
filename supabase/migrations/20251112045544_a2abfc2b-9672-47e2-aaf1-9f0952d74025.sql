-- Add user_id to clients table to link client users to client records
ALTER TABLE public.clients 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_clients_user_id ON public.clients(user_id);

-- Update RLS policy for clients to allow users to view their own client record
CREATE POLICY "Users can view their own client record"
ON public.clients
FOR SELECT
USING (auth.uid() = user_id);

-- Enable realtime for projects, documents, and designs tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.designs;