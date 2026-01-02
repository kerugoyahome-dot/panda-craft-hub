import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { GitBranch, Star, GitFork, RefreshCw, GitCommit, ExternalLink, Key } from "lucide-react";
import { format } from "date-fns";

interface Repository {
  id: string;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  default_branch: string;
  language: string | null;
  stars_count: number;
  forks_count: number;
  is_private: boolean;
  last_synced_at: string | null;
}

interface Commit {
  id: string;
  sha: string;
  message: string;
  author_name: string;
  committed_at: string;
  html_url: string;
}

export const DevHubSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [commits, setCommits] = useState<{ [key: string]: Commit[] }>({});
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [githubToken, setGithubToken] = useState("");
  const [isTokenSet, setIsTokenSet] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRepositories();
    }
  }, [user]);

  const fetchRepositories = async () => {
    const { data, error } = await supabase
      .from("github_repositories")
      .select("*")
      .order("last_synced_at", { ascending: false });

    if (error) {
      console.error("Error fetching repositories:", error);
      return;
    }

    setRepositories(data || []);
    if (data && data.length > 0) {
      setIsTokenSet(true);
    }
  };

  const fetchCommitsForRepo = async (repoId: string) => {
    const { data, error } = await supabase
      .from("github_commits")
      .select("*")
      .eq("repository_id", repoId)
      .order("committed_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching commits:", error);
      return;
    }

    setCommits(prev => ({ ...prev, [repoId]: data || [] }));
  };

  const syncRepositories = async () => {
    if (!githubToken) {
      toast({
        title: "GitHub Token Required",
        description: "Please enter your GitHub Personal Access Token",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/github-sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            action: "fetchRepos",
            githubToken,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to sync repositories");
      }

      toast({
        title: "Success",
        description: `Synced ${result.count} repositories`,
      });

      setIsTokenSet(true);
      await fetchRepositories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const syncCommits = async (repoId: string, fullName: string) => {
    if (!githubToken && !isTokenSet) {
      toast({
        title: "GitHub Token Required",
        description: "Please enter your GitHub Personal Access Token first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/github-sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            action: "fetchCommits",
            repoFullName: fullName,
            githubToken,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to sync commits");
      }

      toast({
        title: "Success",
        description: `Synced ${result.count} commits`,
      });

      await fetchCommitsForRepo(repoId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRepoDetails = async (repo: Repository) => {
    if (selectedRepo === repo.id) {
      setSelectedRepo(null);
    } else {
      setSelectedRepo(repo.id);
      if (!commits[repo.id]) {
        await fetchCommitsForRepo(repo.id);
      }
    }
  };

  return (
    <Card className="bg-gradient-cyber border-2 border-cyber-blue/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold text-cyber-blue font-orbitron flex items-center gap-2">
          <GitBranch className="w-5 h-5" />
          DEV HUB - GITHUB SYNC
        </CardTitle>
        <Badge variant="outline" className="text-cyber-blue border-cyber-blue/50">
          {repositories.length} repos
        </Badge>
      </CardHeader>
      <CardContent>
        {!isTokenSet ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Key className="h-5 w-5 text-cyber-blue" />
              <span className="text-sm text-muted-foreground">Connect to GitHub to sync repositories</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Create a token at:{" "}
              <a 
                href="https://github.com/settings/tokens" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-cyber-blue hover:underline"
              >
                GitHub Settings → Personal Access Tokens
              </a>
            </p>
            <Input
              type="password"
              placeholder="Enter GitHub Personal Access Token"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              className="bg-cyber-gray/50 border-cyber-blue/30"
            />
            <Button 
              onClick={syncRepositories}
              className="w-full bg-cyber-blue/20 border-2 border-cyber-blue text-cyber-blue hover:bg-cyber-blue/30"
              disabled={!githubToken || loading}
            >
              {loading ? "Syncing..." : "Connect & Sync"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={syncRepositories}
                disabled={loading}
                className="bg-cyber-blue/20 border border-cyber-blue text-cyber-blue hover:bg-cyber-blue/30"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Sync
              </Button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {repositories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground font-share-tech">
                  <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  No repositories synced yet. Click Sync to fetch your repos.
                </div>
              ) : (
                repositories.map((repo) => (
                  <div
                    key={repo.id}
                    className="p-4 rounded-lg bg-black/50 border border-cyber-blue/20 hover:border-cyber-blue/40 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <GitBranch className="h-4 w-4 text-cyber-blue shrink-0" />
                          <span className="font-bold text-white font-share-tech truncate">{repo.name}</span>
                          {repo.is_private && (
                            <Badge variant="secondary" className="text-xs">Private</Badge>
                          )}
                          {repo.language && (
                            <Badge variant="outline" className="text-xs text-cyber-blue border-cyber-blue/50">
                              {repo.language}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {repo.description || "No description"}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" /> {repo.stars_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <GitFork className="h-3 w-3" /> {repo.forks_count}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(repo.html_url, "_blank")}
                          className="text-cyber-blue"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRepoDetails(repo)}
                          className="text-cyber-blue"
                        >
                          <GitCommit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {selectedRepo === repo.id && (
                      <div className="border-t border-cyber-blue/20 pt-3 mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-share-tech text-cyber-blue">Recent Commits</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => syncCommits(repo.id, repo.full_name)}
                            disabled={loading}
                            className="text-xs"
                          >
                            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                            Sync
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {commits[repo.id]?.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No commits synced</p>
                          ) : (
                            commits[repo.id]?.map((commit) => (
                              <div
                                key={commit.id}
                                className="p-2 bg-black/30 rounded text-xs"
                              >
                                <p className="text-white truncate">{commit.message.split('\n')[0]}</p>
                                <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                                  <span>{commit.author_name}</span>
                                  <span>•</span>
                                  <span>{format(new Date(commit.committed_at), "MMM d")}</span>
                                  <span>•</span>
                                  <code className="text-cyber-blue">{commit.sha.substring(0, 7)}</code>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};