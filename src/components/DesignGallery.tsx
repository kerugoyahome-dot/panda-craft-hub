import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Image as ImageIcon, Eye, Trash2, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Design {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  file_name: string;
  file_size: number | null;
  thumbnail_path: string | null;
  project_id: string | null;
  tags: string[] | null;
  created_at: string;
  created_by: string;
}

interface DesignGalleryProps {
  onRefresh?: () => void;
}

export const DesignGallery = ({ onRefresh }: DesignGalleryProps) => {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDesigns();

    const channel = supabase
      .channel("design-gallery")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "designs",
        },
        () => fetchDesigns()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDesigns = async () => {
    try {
      const { data, error } = await supabase
        .from("designs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setDesigns(data || []);
    } catch (error) {
      console.error("Error fetching designs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, filePath: string) => {
    if (!confirm("Are you sure you want to delete this design?")) return;

    try {
      await supabase.storage.from("designs").remove([filePath]);
      const { error } = await supabase.from("designs").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Design deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getImageUrl = (filePath: string) => {
    const { data } = supabase.storage.from("designs").getPublicUrl(filePath);
    return data.publicUrl;
  };

  return (
    <>
      <Card className="bg-gradient-cyber border-2 border-cyber-green/30">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold text-cyber-green font-orbitron flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            DESIGN GALLERY
          </CardTitle>
          <Badge variant="outline" className="text-cyber-green border-cyber-green/50">
            {designs.length} designs
          </Badge>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : designs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground font-share-tech">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              No designs uploaded yet. Click "Upload Design" to add your first design.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2">
              {designs.map((design) => (
                <div
                  key={design.id}
                  className="relative group rounded-lg overflow-hidden border border-cyber-green/20 hover:border-cyber-green/50 transition-all cursor-pointer"
                  onClick={() => setSelectedDesign(design)}
                >
                  <div className="aspect-square bg-black/50">
                    <img
                      src={getImageUrl(design.file_path)}
                      alt={design.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white text-sm font-share-tech truncate">
                        {design.title}
                      </p>
                      {design.tags && design.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {design.tags.slice(0, 2).map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs py-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(getImageUrl(design.file_path), "_blank");
                      }}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(design.id, design.file_path);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full view dialog */}
      <Dialog open={!!selectedDesign} onOpenChange={() => setSelectedDesign(null)}>
        <DialogContent className="max-w-4xl bg-cyber-gray border-2 border-cyber-green/30">
          <DialogHeader>
            <DialogTitle className="text-cyber-green font-orbitron">
              {selectedDesign?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedDesign && (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden">
                <img
                  src={getImageUrl(selectedDesign.file_path)}
                  alt={selectedDesign.title}
                  className="w-full h-auto max-h-[60vh] object-contain"
                />
              </div>
              {selectedDesign.description && (
                <p className="text-muted-foreground">{selectedDesign.description}</p>
              )}
              {selectedDesign.tags && selectedDesign.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedDesign.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-cyber-green border-cyber-green/50">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Uploaded on {new Date(selectedDesign.created_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};