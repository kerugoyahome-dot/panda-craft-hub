import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  GitBranch, Star, GitFork, RefreshCw, GitCommit, ExternalLink,
  Key, Plus, FolderOpen, File, Trash2, Save, Code2
} from "lucide-react";
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
  const [addRepoOpen, setAddRepoOpen] = useState(false);
  const [manualRepo, setManualRepo] = useState({
    name: "", full_name: "", html_url: "", description: "", language: "", is_private: false,
  });
  const [codeFiles, setCodeFiles] = useState<{ name: string; content: string }[]>([]);
  const [newFileName, setNewFileName] = useState("");
  const [activeFile, setActiveFile] = useState<number | null>(null);

  useEffect(() => {
    if (user) fetchRepositories();
  }, [user]);

  const fetchRepositories = async () => {
    const { data, error } = await supabase
      .from("github_repositories")
      .select("*")
      .order("last_synced_at", { ascending: false });
    if (!error) {
      setRepositories(data || []);
      if (data && data.length > 0) setIsTokenSet(true);
    }
  };

  const fetchCommitsForRepo = async (repoId: string) => {
    const { data, error } = await supabase
      .from("github_commits")
      .select("*")
      .eq("repository_id", repoId)
      .order("committed_at", { ascending: false })
      .limit(10);
    if (!error) setCommits(prev => ({ ...prev, [repoId]: data || [] }));
  };

  const syncRepositories = async () => {
    if (!githubToken) {
      toast({ title: "Token Required", description: "Enter your GitHub PAT", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github-sync`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
          body: JSON.stringify({ action: "fetchRepos", githubToken }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to sync");
      toast({ title: "Success", description: `Synced ${result.count} repositories` });
      setIsTokenSet(true);
      await fetchRepositories();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const syncCommits = async (repoId: string, fullName: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github-sync`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
          body: JSON.stringify({ action: "fetchCommits", repoFullName: fullName, githubToken }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to sync commits");
      toast({ title: "Success", description: `Synced ${result.count} commits` });
      await fetchCommitsForRepo(repoId);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const addManualRepo = async () => {
    if (!manualRepo.name || !manualRepo.html_url || !user) return;
    const { error } = await supabase.from("github_repositories").insert([{
      name: manualRepo.name,
      full_name: manualRepo.full_name || manualRepo.name,
      html_url: manualRepo.html_url,
      description: manualRepo.description || null,
      language: manualRepo.language || null,
      is_private: manualRepo.is_private,
      user_id: user.id,
      stars_count: 0,
      forks_count: 0,
    }]);
    if (error) {
      toast({ title: "Error", description: "Failed to save repo", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Repository saved" });
      setManualRepo({ name: "", full_name: "", html_url: "", description: "", language: "", is_private: false });
      setAddRepoOpen(false);
      fetchRepositories();
    }
  };

  const deleteRepo = async (id: string) => {
    if (!confirm("Delete this repository entry?")) return;
    await supabase.from("github_repositories").delete().eq("id", id);
    fetchRepositories();
  };

  const addCodeFile = () => {
    if (!newFileName.trim()) return;
    setCodeFiles(prev => [...prev, { name: newFileName, content: "" }]);
    setActiveFile(codeFiles.length);
    setNewFileName("");
  };

  const updateFileContent = (idx: number, content: string) => {
    setCodeFiles(prev => prev.map((f, i) => i === idx ? { ...f, content } : f));
  };

  const saveCodeAsDocument = async (file: { name: string; content: string }) => {
    if (!user) return;
    const blob = new Blob([file.content], { type: "text/plain" });
    const path = `${user.id}/code/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("documents").upload(path, blob);
    if (uploadError) { toast({ title: "Error", description: "Upload failed", variant: "destructive" }); return; }
    const { error } = await supabase.from("documents").insert([{
      title: file.name,
      file_path: path,
      file_name: file.name,
      file_size: blob.size,
      file_type: "text/plain",
      created_by: user.id,
    }]);
    if (error) {
      toast({ title: "Error", description: "Save failed", variant: "destructive" });
    } else {
      toast({ title: "Saved", description: `${file.name} saved to documents` });
    }
  };

  const toggleRepoDetails = async (repo: Repository) => {
    if (selectedRepo === repo.id) {
      setSelectedRepo(null);
    } else {
      setSelectedRepo(repo.id);
      if (!commits[repo.id]) await fetchCommitsForRepo(repo.id);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 border-2 border-primary/30">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold text-primary font-orbitron flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            DEV HUB - REPOSITORIES
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setAddRepoOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Repo
            </Button>
            <Badge variant="outline" className="text-primary border-primary/50">
              {repositories.length} repos
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!isTokenSet && repositories.length === 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Key className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Connect GitHub or add repos manually</span>
              </div>
              <Input
                type="password"
                placeholder="GitHub Personal Access Token (optional)"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={syncRepositories} disabled={!githubToken || loading} className="flex-1">
                  {loading ? "Syncing..." : "Connect & Sync"}
                </Button>
                <Button variant="outline" onClick={() => setAddRepoOpen(true)} className="flex-1">
                  <Plus className="h-4 w-4 mr-1" /> Add Manually
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={syncRepositories} disabled={loading} variant="outline">
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Sync
                </Button>
              </div>
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-3 pr-2">
                  {repositories.map((repo) => (
                    <div key={repo.id} className="p-4 rounded-lg bg-muted/50 border border-primary/20 hover:border-primary/40 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <GitBranch className="h-4 w-4 text-primary shrink-0" />
                            <span className="font-bold truncate">{repo.name}</span>
                            {repo.is_private && <Badge variant="secondary" className="text-xs">Private</Badge>}
                            {repo.language && <Badge variant="outline" className="text-xs">{repo.language}</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{repo.description || "No description"}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {repo.stars_count}</span>
                            <span className="flex items-center gap-1"><GitFork className="h-3 w-3" /> {repo.forks_count}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="sm" onClick={() => window.open(repo.html_url, "_blank")}><ExternalLink className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => toggleRepoDetails(repo)}><GitCommit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteRepo(repo.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                      {selectedRepo === repo.id && (
                        <div className="border-t border-primary/20 pt-3 mt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-primary">Recent Commits</span>
                            <Button size="sm" variant="ghost" onClick={() => syncCommits(repo.id, repo.full_name)} disabled={loading}>
                              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} /> Sync
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {commits[repo.id]?.length === 0 ? (
                              <p className="text-xs text-muted-foreground">No commits synced</p>
                            ) : (
                              commits[repo.id]?.map((commit) => (
                                <div key={commit.id} className="p-2 bg-muted/30 rounded text-xs">
                                  <p className="truncate">{commit.message.split('\n')[0]}</p>
                                  <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                                    <span>{commit.author_name}</span>
                                    <span>•</span>
                                    <span>{format(new Date(commit.committed_at), "MMM d")}</span>
                                    <span>•</span>
                                    <code className="text-primary">{commit.sha.substring(0, 7)}</code>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Code File Editor */}
      <Card className="bg-card/50 border-2 border-primary/30">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold text-primary font-orbitron flex items-center gap-2">
            <Code2 className="w-5 h-5" />
            CODE FILES
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="filename.js"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCodeFile()}
            />
            <Button onClick={addCodeFile} disabled={!newFileName.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Add File
            </Button>
          </div>
          {codeFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex gap-2 flex-wrap">
                {codeFiles.map((f, i) => (
                  <Button
                    key={i}
                    variant={activeFile === i ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFile(i)}
                    className="text-xs"
                  >
                    <File className="h-3 w-3 mr-1" /> {f.name}
                  </Button>
                ))}
              </div>
              {activeFile !== null && codeFiles[activeFile] && (
                <div className="space-y-2">
                  <Textarea
                    value={codeFiles[activeFile].content}
                    onChange={(e) => updateFileContent(activeFile, e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                    placeholder={`// Write code for ${codeFiles[activeFile].name}...`}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveCodeAsDocument(codeFiles[activeFile])}>
                      <Save className="h-4 w-4 mr-1" /> Save to Documents
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setCodeFiles(prev => prev.filter((_, i) => i !== activeFile));
                        setActiveFile(null);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          {codeFiles.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-4">
              Create code files to write and save snippets, configs, or scripts.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add Repo Dialog */}
      <Dialog open={addRepoOpen} onOpenChange={setAddRepoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Repository</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Repository Name *</Label>
              <Input value={manualRepo.name} onChange={(e) => setManualRepo(p => ({ ...p, name: e.target.value }))} placeholder="my-project" />
            </div>
            <div>
              <Label>Full Name</Label>
              <Input value={manualRepo.full_name} onChange={(e) => setManualRepo(p => ({ ...p, full_name: e.target.value }))} placeholder="username/my-project" />
            </div>
            <div>
              <Label>URL *</Label>
              <Input value={manualRepo.html_url} onChange={(e) => setManualRepo(p => ({ ...p, html_url: e.target.value }))} placeholder="https://github.com/..." />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={manualRepo.description} onChange={(e) => setManualRepo(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <Label>Language</Label>
              <Input value={manualRepo.language} onChange={(e) => setManualRepo(p => ({ ...p, language: e.target.value }))} placeholder="TypeScript" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddRepoOpen(false)}>Cancel</Button>
              <Button onClick={addManualRepo} disabled={!manualRepo.name || !manualRepo.html_url}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
