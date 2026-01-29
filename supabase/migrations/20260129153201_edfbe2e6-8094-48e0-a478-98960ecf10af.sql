-- Create document_versions table for version control
CREATE TABLE public.document_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  content TEXT,
  file_path TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  change_description TEXT
);

-- Create index for faster lookups
CREATE INDEX idx_document_versions_document_id ON public.document_versions(document_id);

-- Enable RLS
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view document versions" 
ON public.document_versions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.documents d 
    WHERE d.id = document_versions.document_id 
    AND (d.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Users can create document versions" 
ON public.document_versions 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM public.documents d 
    WHERE d.id = document_versions.document_id 
    AND (d.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Enable realtime for document_versions
ALTER PUBLICATION supabase_realtime ADD TABLE public.document_versions;