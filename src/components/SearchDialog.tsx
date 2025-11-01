import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Search, FolderKanban, Users, Palette, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SearchDialog = ({ open, onOpenChange }: SearchDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    projects: any[];
    clients: any[];
    designs: any[];
    documents: any[];
  }>({
    projects: [],
    clients: [],
    designs: [],
    documents: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults({ projects: [], clients: [], designs: [], documents: [] });
      return;
    }

    const searchData = async () => {
      setLoading(true);
      try {
        const searchTerm = `%${query}%`;

        const [projectsData, clientsData, designsData, documentsData] = await Promise.all([
          supabase
            .from("projects")
            .select("*")
            .eq("created_by", user?.id)
            .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
            .limit(5),
          supabase
            .from("clients")
            .select("*")
            .eq("created_by", user?.id)
            .or(`name.ilike.${searchTerm},company.ilike.${searchTerm},email.ilike.${searchTerm}`)
            .limit(5),
          supabase
            .from("designs")
            .select("*")
            .eq("created_by", user?.id)
            .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
            .limit(5),
          supabase
            .from("documents")
            .select("*")
            .eq("created_by", user?.id)
            .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
            .limit(5),
        ]);

        setResults({
          projects: projectsData.data || [],
          clients: clientsData.data || [],
          designs: designsData.data || [],
          documents: documentsData.data || [],
        });
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchData, 300);
    return () => clearTimeout(debounce);
  }, [query, user]);

  const handleNavigate = (type: string, id?: string) => {
    onOpenChange(false);
    setQuery("");
    switch (type) {
      case "projects":
        navigate("/projects", { state: { highlightId: id } });
        break;
      case "clients":
        navigate("/clients", { state: { highlightId: id } });
        break;
      case "designs":
        navigate("/designs", { state: { highlightId: id } });
        break;
      case "documents":
        navigate("/documents", { state: { highlightId: id } });
        break;
    }
  };

  const totalResults =
    results.projects.length +
    results.clients.length +
    results.designs.length +
    results.documents.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-cyber-gray border-2 border-cyber-blue/30 text-white max-w-2xl">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyber-blue" />
            <Input
              placeholder="▸ SEARCH DATABASE..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 bg-cyber-gray/50 border-cyber-blue/30 text-white font-share-tech"
              autoFocus
            />
          </div>

          {loading && (
            <div className="text-center py-8 text-cyber-blue font-share-tech">
              SCANNING DATABASE...
            </div>
          )}

          {!loading && query.length >= 2 && totalResults === 0 && (
            <div className="text-center py-8 text-muted-foreground font-share-tech">
              NO RESULTS FOUND
            </div>
          )}

          {!loading && totalResults > 0 && (
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {results.projects.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold mb-2 text-cyber-blue font-share-tech flex items-center gap-2">
                    <FolderKanban className="w-4 h-4" />
                    PROJECTS ({results.projects.length})
                  </h3>
                  {results.projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleNavigate("projects", project.id)}
                      className="w-full text-left p-3 rounded-lg hover:bg-cyber-blue/10 border border-cyber-blue/30 mb-2 transition-all"
                    >
                      <p className="font-medium text-white font-share-tech">{project.name}</p>
                      {project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {project.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {results.clients.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold mb-2 text-cyber-green font-share-tech flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    CLIENTS ({results.clients.length})
                  </h3>
                  {results.clients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => handleNavigate("clients", client.id)}
                      className="w-full text-left p-3 rounded-lg hover:bg-cyber-green/10 border border-cyber-green/30 mb-2 transition-all"
                    >
                      <p className="font-medium text-white font-share-tech">{client.name}</p>
                      {client.company && (
                        <p className="text-sm text-muted-foreground">{client.company}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {results.designs.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold mb-2 text-cyber-blue font-share-tech flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    DESIGNS ({results.designs.length})
                  </h3>
                  {results.designs.map((design) => (
                    <button
                      key={design.id}
                      onClick={() => handleNavigate("designs", design.id)}
                      className="w-full text-left p-3 rounded-lg hover:bg-cyber-blue/10 border border-cyber-blue/30 mb-2 transition-all"
                    >
                      <p className="font-medium text-white font-share-tech">{design.title}</p>
                      {design.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {design.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {results.documents.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold mb-2 text-cyber-green font-share-tech flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    DOCUMENTS ({results.documents.length})
                  </h3>
                  {results.documents.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => handleNavigate("documents", doc.id)}
                      className="w-full text-left p-3 rounded-lg hover:bg-cyber-green/10 border border-cyber-green/30 mb-2 transition-all"
                    >
                      <p className="font-medium text-white font-share-tech">{doc.title}</p>
                      {doc.content && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{doc.content}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
