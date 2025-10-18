import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  private: boolean;
}

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  html_url: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { action, repoFullName, githubToken } = await req.json();

    if (!githubToken) {
      throw new Error('GitHub token is required');
    }

    const headers = {
      'Authorization': `token ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Lovable-DevHub',
    };

    if (action === 'fetchRepos') {
      // Fetch user's repositories
      const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
        headers,
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const repos: GitHubRepo[] = await response.json();

      // Store repos in database
      for (const repo of repos) {
        await supabaseClient
          .from('github_repositories')
          .upsert({
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description,
            html_url: repo.html_url,
            default_branch: repo.default_branch,
            language: repo.language,
            stars_count: repo.stargazers_count,
            forks_count: repo.forks_count,
            is_private: repo.private,
            last_synced_at: new Date().toISOString(),
            user_id: user.id,
          }, {
            onConflict: 'full_name,user_id',
          });
      }

      return new Response(
        JSON.stringify({ success: true, count: repos.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'fetchCommits' && repoFullName) {
      // Fetch repository from database
      const { data: repo } = await supabaseClient
        .from('github_repositories')
        .select('*')
        .eq('full_name', repoFullName)
        .eq('user_id', user.id)
        .single();

      if (!repo) {
        throw new Error('Repository not found');
      }

      // Fetch commits from GitHub
      const response = await fetch(
        `https://api.github.com/repos/${repoFullName}/commits?per_page=50`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const commits: GitHubCommit[] = await response.json();

      // Store commits in database
      for (const commit of commits) {
        await supabaseClient
          .from('github_commits')
          .upsert({
            repository_id: repo.id,
            sha: commit.sha,
            message: commit.commit.message,
            author_name: commit.commit.author.name,
            author_email: commit.commit.author.email,
            committed_at: commit.commit.author.date,
            html_url: commit.html_url,
            user_id: user.id,
          }, {
            onConflict: 'repository_id,sha',
          });
      }

      // Update last synced
      await supabaseClient
        .from('github_repositories')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', repo.id);

      return new Response(
        JSON.stringify({ success: true, count: commits.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
