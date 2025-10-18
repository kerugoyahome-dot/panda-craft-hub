import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
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

const DevHub = () => {
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
      toast({
        title: "Error",
        description: "Failed to fetch repositories",
        variant: "destructive",
      });
      return;
    }

    setRepositories(data || []);
  };

  const fetchCommitsForRepo = async (repoId: string, fullName: string) => {
    const { data, error } = await supabase
      .from("github_commits")
      .select("*")
      .eq("repository_id", repoId)
      .order("committed_at", { ascending: false })
      .limit(10);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch commits",
        variant: "destructive",
      });
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

      await fetchCommitsForRepo(repoId, fullName);
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
        await fetchCommitsForRepo(repo.id, repo.full_name);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="ml-20 flex-1">
        <Header />
        
        <main className="p-8">
          {!isTokenSet ? (
            <Card className="p-6 max-w-2xl mx-auto">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Key className="h-5 w-5 text-gold" />
                  <h2 className="text-xl font-semibold">Connect to GitHub</h2>
                </div>
                <p className="text-muted-foreground">
                  To sync your repositories and commits, you need to provide a GitHub Personal Access Token.
                  Create one at: <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">GitHub Settings → Developer Settings → Personal Access Tokens</a>
                </p>
                <p className="text-sm text-muted-foreground">
                  Required scopes: <code className="bg-secondary px-2 py-1 rounded">repo</code>
                </p>
                <Input
                  type="password"
                  placeholder="Enter your GitHub Personal Access Token"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                />
                <Button 
                  onClick={() => {
                    if (githubToken) {
                      setIsTokenSet(true);
                      syncRepositories();
                    }
                  }}
                  className="w-full"
                  disabled={!githubToken}
                >
                  Connect & Sync Repositories
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-gold border-gold">
                    {repositories.length} Repositories
                  </Badge>
                </div>
                <Button
                  onClick={syncRepositories}
                  disabled={loading}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Sync Repositories
                </Button>
              </div>

              <div className="grid gap-4">
                {repositories.map((repo) => (
                  <Card key={repo.id} className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <GitBranch className="h-5 w-5 text-gold" />
                            <h3 className="text-lg font-semibold">{repo.name}</h3>
                            {repo.is_private && (
                              <Badge variant="secondary">Private</Badge>
                            )}
                            {repo.language && (
                              <Badge variant="outline">{repo.language}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {repo.description || "No description"}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4" />
                              {repo.stars_count}
                            </div>
                            <div className="flex items-center gap-1">
                              <GitFork className="h-4 w-4" />
                              {repo.forks_count}
                            </div>
                            {repo.last_synced_at && (
                              <span className="text-xs">
                                Last synced: {format(new Date(repo.last_synced_at), "PPp")}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(repo.html_url, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleRepoDetails(repo)}
                          >
                            <GitCommit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => syncCommits(repo.id, repo.full_name)}
                            disabled={loading}
                          >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                      </div>

                      {selectedRepo === repo.id && commits[repo.id] && (
                        <div className="border-t pt-4 mt-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <GitCommit className="h-4 w-4" />
                            Recent Commits
                          </h4>
                          <div className="space-y-2">
                            {commits[repo.id].length === 0 ? (
                              <p className="text-sm text-muted-foreground">No commits synced yet</p>
                            ) : (
                              commits[repo.id].map((commit) => (
                                <div
                                  key={commit.id}
                                  className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {commit.message.split('\n')[0]}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                      <span>{commit.author_name}</span>
                                      <span>•</span>
                                      <span>{format(new Date(commit.committed_at), "PPp")}</span>
                                      <span>•</span>
                                      <code className="text-xs">{commit.sha.substring(0, 7)}</code>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(commit.html_url, "_blank")}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}

                {repositories.length === 0 && (
                  <Card className="p-12 text-center">
                    <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Repositories Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Click "Sync Repositories" to fetch your GitHub repositories
                    </p>
                  </Card>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default DevHub;
