-- Create storage bucket for department chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('department-attachments', 'department-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for department attachments bucket
CREATE POLICY "Authenticated users can upload department attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'department-attachments');

CREATE POLICY "Anyone can view department attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'department-attachments');

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'department-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add attachment columns to department_messages table
ALTER TABLE public.department_messages 
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT;

-- Add records_management to department_type enum
ALTER TYPE public.department_type ADD VALUE IF NOT EXISTS 'records_management';