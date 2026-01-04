-- Create function to update timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create advertising_assets table for videos, flyers, and images
CREATE TABLE IF NOT EXISTS public.advertising_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  asset_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  thumbnail_path TEXT,
  coverage TEXT,
  expense_amount DECIMAL(12, 2) DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expense_requests table for finance requests
CREATE TABLE IF NOT EXISTS public.expense_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  requesting_department TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  advertising_asset_id UUID REFERENCES public.advertising_assets(id) ON DELETE SET NULL,
  requested_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for advertising assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('advertising-assets', 'advertising-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on tables
ALTER TABLE public.advertising_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for advertising_assets
CREATE POLICY "Anyone can view advertising assets"
  ON public.advertising_assets FOR SELECT
  USING (true);

CREATE POLICY "Advertising members can create assets"
  ON public.advertising_assets FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Advertising members can update their assets"
  ON public.advertising_assets FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Advertising members can delete their assets"
  ON public.advertising_assets FOR DELETE
  USING (auth.uid() = created_by);

-- RLS policies for expense_requests
CREATE POLICY "Anyone can view expense requests"
  ON public.expense_requests FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create expense requests"
  ON public.expense_requests FOR INSERT
  WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Financial department can update expense requests"
  ON public.expense_requests FOR UPDATE
  USING (true);

-- Storage policies for advertising-assets bucket
CREATE POLICY "Public can view advertising assets storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'advertising-assets');

CREATE POLICY "Authenticated users can upload advertising assets storage"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'advertising-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their advertising assets storage"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'advertising-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their advertising assets storage"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'advertising-assets' AND auth.role() = 'authenticated');

-- Trigger for updated_at
CREATE TRIGGER update_advertising_assets_updated_at
  BEFORE UPDATE ON public.advertising_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expense_requests_updated_at
  BEFORE UPDATE ON public.expense_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.advertising_assets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expense_requests;