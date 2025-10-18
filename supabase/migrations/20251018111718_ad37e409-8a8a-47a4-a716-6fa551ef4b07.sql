-- Create GitHub repositories table
CREATE TABLE public.github_repositories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  description TEXT,
  html_url TEXT NOT NULL,
  default_branch TEXT DEFAULT 'main',
  language TEXT,
  stars_count INTEGER DEFAULT 0,
  forks_count INTEGER DEFAULT 0,
  is_private BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create GitHub commits table
CREATE TABLE public.github_commits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  repository_id UUID NOT NULL REFERENCES public.github_repositories(id) ON DELETE CASCADE,
  sha TEXT NOT NULL,
  message TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT,
  committed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  html_url TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(repository_id, sha)
);

-- Enable Row Level Security
ALTER TABLE public.github_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_commits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for github_repositories
CREATE POLICY "Users can view their own repositories"
  ON public.github_repositories
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own repositories"
  ON public.github_repositories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own repositories"
  ON public.github_repositories
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own repositories"
  ON public.github_repositories
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for github_commits
CREATE POLICY "Users can view their own commits"
  ON public.github_commits
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own commits"
  ON public.github_commits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own commits"
  ON public.github_commits
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own commits"
  ON public.github_commits
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_github_repositories_updated_at
  BEFORE UPDATE ON public.github_repositories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_github_commits_updated_at
  BEFORE UPDATE ON public.github_commits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_github_repositories_user_id ON public.github_repositories(user_id);
CREATE INDEX idx_github_commits_repository_id ON public.github_commits(repository_id);
CREATE INDEX idx_github_commits_user_id ON public.github_commits(user_id);
CREATE INDEX idx_github_commits_committed_at ON public.github_commits(committed_at DESC);