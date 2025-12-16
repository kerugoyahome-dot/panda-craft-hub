-- Create department enum
CREATE TYPE public.department_type AS ENUM (
  'financial', 
  'graphic_design', 
  'developers', 
  'advertising', 
  'compliance',
  'management'
);

-- Add department column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS department_type public.department_type DEFAULT NULL;

-- Update the updated_at trigger for profiles if not exists
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();