import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Video, 
  Image as ImageIcon, 
  FileImage, 
  Upload, 
  Trash2, 
  Eye, 
  DollarSign,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Play,
  AlertCircle
} from "lucide-react";

interface AdvertisingAsset {
  id: string;
  title: string;
  description: string | null;
  asset_type: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  coverage: string | null;
  expense_amount: number;
  status: string;
  created_by: string;
  created_at: string;
}

interface ExpenseRequest {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  requesting_department: string;
  status: string;
  approved_by: string | null;
  rejection_reason: string | null;
  advertising_asset_id: string | null;
  requested_by: string;
  created_at: string;
}

export const AdvertisingSection = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState<AdvertisingAsset[]>([]);
  const [expenseRequests, setExpenseRequests] = useState<ExpenseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<AdvertisingAsset | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    assetType: "image" as "video" | "flyer" | "image",
    coverage: "",
    expenseAmount: ""
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Expense request form state
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    description: "",
    amount: "",
    assetId: ""
  });

  useEffect(() => {
    fetchData();
    
    const channel = supabase
      .channel("advertising-realtime")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "advertising_assets"
      }, () => fetchData())
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "expense_requests"
      }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [assetsRes, expenseRes] = await Promise.all([
        supabase
          .from("advertising_assets")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("expense_requests")
          .select("*")
          .eq("requesting_department", "advertising")
          .order("created_at", { ascending: false })
      ]);

      if (assetsRes.error) throw assetsRes.error;
      if (expenseRes.error) throw expenseRes.error;

      setAssets(assetsRes.data || []);
      setExpenseRequests(expenseRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch advertising data");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      
      if (!isVideo && !isImage) {
        toast.error("Please upload a valid image or video file");
        return;
      }
      
      setSelectedFile(file);
      
      // Auto-detect type
      if (isVideo) {
        setUploadForm(prev => ({ ...prev, assetType: "video" }));
      } else {
        setUploadForm(prev => ({ ...prev, assetType: "image" }));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user || !uploadForm.title) {
      toast.error("Please fill in all required fields");
      return;
    }

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("advertising-assets")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from("advertising_assets")
        .insert({
          title: uploadForm.title,
          description: uploadForm.description || null,
          asset_type: uploadForm.assetType,
          file_path: filePath,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          coverage: uploadForm.coverage || null,
          expense_amount: uploadForm.expenseAmount ? parseFloat(uploadForm.expenseAmount) : 0,
          status: "published",
          created_by: user.id
        });

      if (dbError) throw dbError;

      toast.success("Asset uploaded successfully!");
      setUploadOpen(false);
      setSelectedFile(null);
      setUploadForm({
        title: "",
        description: "",
        assetType: "image",
        coverage: "",
        expenseAmount: ""
      });
      fetchData();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload asset");
    } finally {
      setUploading(false);
    }
  };

  const handleRequestExpense = async () => {
    if (!user || !expenseForm.title || !expenseForm.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { error } = await supabase
        .from("expense_requests")
        .insert({
          title: expenseForm.title,
          description: expenseForm.description || null,
          amount: parseFloat(expenseForm.amount),
          requesting_department: "advertising",
          advertising_asset_id: expenseForm.assetId || null,
          requested_by: user.id
        });

      if (error) throw error;

      toast.success("Expense request submitted to Finance department!");
      setExpenseOpen(false);
      setExpenseForm({ title: "", description: "", amount: "", assetId: "" });
      fetchData();
    } catch (error) {
      console.error("Error submitting expense request:", error);
      toast.error("Failed to submit expense request");
    }
  };

  const handleDeleteAsset = async (asset: AdvertisingAsset) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;

    try {
      await supabase.storage.from("advertising-assets").remove([asset.file_path]);
      
      const { error } = await supabase
        .from("advertising_assets")
        .delete()
        .eq("id", asset.id);

      if (error) throw error;

      toast.success("Asset deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete asset");
    }
  };

  const getAssetUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from("advertising-assets")
      .getPublicUrl(filePath);
    return data?.publicUrl;
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="w-5 h-5" />;
      case "flyer": return <FileImage className="w-5 h-5" />;
      default: return <ImageIcon className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-cyber-green/20 text-cyber-green border-cyber-green/50"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/50"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-cyber-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex gap-4 flex-wrap">
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cyber-blue/20 border-2 border-cyber-blue text-cyber-blue hover:bg-cyber-blue/30">
              <Upload className="w-4 h-4 mr-2" />
              UPLOAD ASSET
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-cyber-gray border-2 border-cyber-blue/50 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-cyber-blue font-orbitron">Upload Advertising Asset</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-white">Title *</Label>
                <Input
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-black/50 border-cyber-blue/30 text-white"
                  placeholder="Asset title"
                />
              </div>
              <div>
                <Label className="text-white">Description</Label>
                <Textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-black/50 border-cyber-blue/30 text-white"
                  placeholder="Describe the asset..."
                />
              </div>
              <div>
                <Label className="text-white">Asset Type</Label>
                <Select
                  value={uploadForm.assetType}
                  onValueChange={(v) => setUploadForm(prev => ({ ...prev, assetType: v as any }))}
                >
                  <SelectTrigger className="bg-black/50 border-cyber-blue/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="flyer">Flyer</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white">Coverage Details</Label>
                <Input
                  value={uploadForm.coverage}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, coverage: e.target.value }))}
                  className="bg-black/50 border-cyber-blue/30 text-white"
                  placeholder="e.g., Social media, TV, Billboard..."
                />
              </div>
              <div>
                <Label className="text-white">Expense Amount (KSH)</Label>
                <Input
                  type="number"
                  value={uploadForm.expenseAmount}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, expenseAmount: e.target.value }))}
                  className="bg-black/50 border-cyber-blue/30 text-white"
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label className="text-white">File (Image/Video) *</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/20"
                >
                  {selectedFile ? selectedFile.name : "Choose File"}
                </Button>
              </div>
              <Button
                onClick={handleUpload}
                disabled={uploading || !selectedFile || !uploadForm.title}
                className="w-full bg-cyber-green/20 border border-cyber-green text-cyber-green hover:bg-cyber-green/30"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                Upload Asset
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
          <DialogTrigger asChild>
            <Button className="bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400 hover:bg-yellow-500/30">
              <DollarSign className="w-4 h-4 mr-2" />
              REQUEST FINANCE
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-cyber-gray border-2 border-yellow-500/50 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-yellow-400 font-orbitron">Request Expense from Finance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-white">Request Title *</Label>
                <Input
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-black/50 border-yellow-500/30 text-white"
                  placeholder="e.g., Billboard Campaign Budget"
                />
              </div>
              <div>
                <Label className="text-white">Description</Label>
                <Textarea
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-black/50 border-yellow-500/30 text-white"
                  placeholder="Describe the expense request..."
                />
              </div>
              <div>
                <Label className="text-white">Amount (KSH) *</Label>
                <Input
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="bg-black/50 border-yellow-500/30 text-white"
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label className="text-white">Related Asset (Optional)</Label>
                <Select
                  value={expenseForm.assetId}
                  onValueChange={(v) => setExpenseForm(prev => ({ ...prev, assetId: v }))}
                >
                  <SelectTrigger className="bg-black/50 border-yellow-500/30 text-white">
                    <SelectValue placeholder="Select asset..." />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.map(asset => (
                      <SelectItem key={asset.id} value={asset.id}>{asset.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleRequestExpense}
                disabled={!expenseForm.title || !expenseForm.amount}
                className="w-full bg-yellow-500/20 border border-yellow-500 text-yellow-400 hover:bg-yellow-500/30"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit to Finance Department
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Assets Grid */}
      <Card className="bg-gradient-cyber border-2 border-cyber-blue/30">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-cyber-blue font-orbitron flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            ADVERTISING ASSETS
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No advertising assets uploaded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.map(asset => (
                <div
                  key={asset.id}
                  className="relative group rounded-lg overflow-hidden border border-cyber-blue/30 bg-black/50"
                >
                  {/* Thumbnail/Preview */}
                  <div className="aspect-video bg-cyber-gray/50 relative">
                    {asset.asset_type === "video" ? (
                      <div className="w-full h-full flex items-center justify-center bg-black/80">
                        <video
                          src={getAssetUrl(asset.file_path)}
                          className="max-w-full max-h-full object-contain"
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-cyber-blue/80 flex items-center justify-center">
                            <Play className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={getAssetUrl(asset.file_path)}
                        alt={asset.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPreviewAsset(asset)}
                        className="border-cyber-blue text-cyber-blue hover:bg-cyber-blue/20"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteAsset(asset)}
                        className="border-red-500 text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      {getAssetIcon(asset.asset_type)}
                      <span className="font-bold text-white truncate">{asset.title}</span>
                    </div>
                    {asset.coverage && (
                      <p className="text-xs text-muted-foreground mb-1">
                        Coverage: {asset.coverage}
                      </p>
                    )}
                    {asset.expense_amount > 0 && (
                      <p className="text-xs text-yellow-400">
                        Expense: KSH {asset.expense_amount.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expense Requests */}
      <Card className="bg-gradient-cyber border-2 border-yellow-500/30">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-yellow-400 font-orbitron flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            EXPENSE REQUESTS
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expenseRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No expense requests submitted yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenseRequests.map(request => (
                <div
                  key={request.id}
                  className="p-4 rounded-lg bg-black/50 border border-yellow-500/20"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-white">{request.title}</h4>
                      {request.description && (
                        <p className="text-sm text-muted-foreground">{request.description}</p>
                      )}
                      <p className="text-lg font-bold text-yellow-400 mt-1">
                        KSH {request.amount.toLocaleString()}
                      </p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                  {request.rejection_reason && (
                    <p className="text-sm text-red-400 mt-2">
                      Reason: {request.rejection_reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewAsset} onOpenChange={() => setPreviewAsset(null)}>
        <DialogContent className="bg-cyber-gray border-2 border-cyber-blue/50 max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-cyber-blue font-orbitron">{previewAsset?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {previewAsset?.asset_type === "video" ? (
              <video
                src={getAssetUrl(previewAsset.file_path)}
                controls
                className="max-w-full max-h-[70vh]"
              />
            ) : (
              <img
                src={previewAsset ? getAssetUrl(previewAsset.file_path) : ""}
                alt={previewAsset?.title}
                className="max-w-full max-h-[70vh] object-contain"
              />
            )}
          </div>
          {previewAsset?.coverage && (
            <p className="text-muted-foreground">Coverage: {previewAsset.coverage}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};