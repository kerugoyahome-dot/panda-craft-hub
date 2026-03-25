import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Bell, Shield, Database, Mail, Download, Trash2, ScrollText } from "lucide-react";
import { AuditTrailViewer } from "@/components/AuditTrailViewer";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Settings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ full_name: "", department: "", avatar_url: "" });
  const [notifications, setNotifications] = useState({ email: true, push: false, updates: true, security: true });
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 10737418240 });

  useEffect(() => {
    if (user) { fetchProfile(); fetchNotificationPreferences(); fetchStorageUsage(); }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user?.id).maybeSingle();
      if (error) throw error;
      if (data) setProfile({ full_name: data.full_name || "", department: data.department || "", avatar_url: data.avatar_url || "" });
    } catch (error) { console.error("Error fetching profile:", error); }
  };

  const updateProfile = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.from("profiles").update(profile).eq("id", user?.id);
      if (error) throw error;
      toast({ title: "Success", description: "Profile updated successfully" });
    } catch (error: any) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const fetchNotificationPreferences = async () => {
    try {
      const { data, error } = await supabase.from("user_preferences" as any).select("*").eq("user_id", user?.id).maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) setNotifications({ email: (data as any).email_notifications ?? true, push: (data as any).push_notifications ?? false, updates: (data as any).project_updates ?? true, security: (data as any).security_alerts ?? true });
    } catch (error) { console.error("Error fetching preferences:", error); }
  };

  const fetchStorageUsage = async () => {
    try {
      const { data: documents } = await supabase.from("documents").select("file_size").eq("created_by", user?.id);
      const { data: designs } = await supabase.from("designs").select("file_size").eq("created_by", user?.id);
      const totalUsed = [...(documents || []), ...(designs || [])].reduce((sum, item) => sum + (item.file_size || 0), 0);
      setStorageUsage(prev => ({ ...prev, used: totalUsed }));
    } catch (error) { console.error("Error fetching storage:", error); }
  };

  const saveNotificationPreferences = async () => {
    try {
      setLoading(true);
      const { data: existing } = await supabase.from("user_preferences" as any).select("id").eq("user_id", user?.id).maybeSingle();
      const preferenceData = { user_id: user?.id, email_notifications: notifications.email, push_notifications: notifications.push, project_updates: notifications.updates, security_alerts: notifications.security };
      if (existing) {
        const { error } = await supabase.from("user_preferences" as any).update(preferenceData).eq("user_id", user?.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_preferences" as any).insert([preferenceData]);
        if (error) throw error;
      }
      toast({ title: "Success", description: "Notification preferences saved" });
    } catch (error: any) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handlePasswordReset = async () => {
    try {
      if (!user?.email) return;
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: `${window.location.origin}/auth` });
      if (error) throw error;
      toast({ title: "Password Reset Email Sent", description: "Check your email for password reset instructions" });
    } catch (error: any) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
  };

  const handleExportData = async () => {
    try {
      setLoading(true);
      const [profileData, projectsData, clientsData, documentsData, designsData, tasksData] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user?.id).maybeSingle(),
        supabase.from("projects").select("*").eq("created_by", user?.id),
        supabase.from("clients").select("*").eq("created_by", user?.id),
        supabase.from("documents").select("*").eq("created_by", user?.id),
        supabase.from("designs").select("*").eq("created_by", user?.id),
        supabase.from("tasks").select("*").eq("created_by", user?.id),
      ]);
      const exportData = { exportDate: new Date().toISOString(), user: { id: user?.id, email: user?.email }, profile: profileData.data, projects: projectsData.data || [], clients: clientsData.data || [], documents: documentsData.data || [], designs: designsData.data || [], tasks: tasksData.data || [] };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Success", description: "Your data has been exported successfully" });
    } catch (error: any) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      await Promise.all([
        supabase.from("tasks").delete().eq("created_by", user?.id),
        supabase.from("documents").delete().eq("created_by", user?.id),
        supabase.from("designs").delete().eq("created_by", user?.id),
        supabase.from("projects").delete().eq("created_by", user?.id),
        supabase.from("clients").delete().eq("created_by", user?.id),
        supabase.from("user_preferences" as any).delete().eq("user_id", user?.id),
      ]);
      await supabase.auth.signOut();
      toast({ title: "Account Deleted", description: "Your account has been permanently deleted" });
    } catch (error: any) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Header />

      <main className="ml-20 pt-16 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 animate-slide-up">
            <h1 className="text-3xl font-bold mb-2 text-foreground font-playfair">Settings</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile"><User className="w-4 h-4 mr-2" />Profile</TabsTrigger>
              <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-2" />Notifications</TabsTrigger>
              <TabsTrigger value="security"><Shield className="w-4 h-4 mr-2" />Security</TabsTrigger>
              <TabsTrigger value="data"><Database className="w-4 h-4 mr-2" />Data</TabsTrigger>
              <TabsTrigger value="audit"><ScrollText className="w-4 h-4 mr-2" />Audit Log</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-1 text-foreground font-playfair flex items-center gap-2"><User className="w-5 h-5 text-primary" />User Profile</h3>
                    <p className="text-sm text-muted-foreground">Update your personal information</p>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" value={user?.email || ""} disabled className="bg-muted/50" />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input id="full_name" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input id="department" value={profile.department} onChange={(e) => setProfile({ ...profile, department: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="avatar_url">Avatar URL</Label>
                      <Input id="avatar_url" value={profile.avatar_url} onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })} placeholder="https://example.com/avatar.jpg" />
                    </div>
                  </div>
                  <Button onClick={updateProfile} disabled={loading} className="w-full">
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-1 text-foreground font-playfair flex items-center gap-2"><Bell className="w-5 h-5 text-primary" />Notification Preferences</h3>
                    <p className="text-sm text-muted-foreground">Manage how you receive alerts</p>
                  </div>
                  <Separator />
                  <div className="space-y-6">
                    {[
                      { key: "email", label: "Email Notifications", desc: "Receive notifications via email" },
                      { key: "push", label: "Push Notifications", desc: "Receive browser push notifications" },
                      { key: "updates", label: "Project Updates", desc: "Get notified about project changes" },
                      { key: "security", label: "Security Alerts", desc: "Critical security notifications" },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>{label}</Label>
                          <p className="text-sm text-muted-foreground">{desc}</p>
                        </div>
                        <Switch checked={notifications[key as keyof typeof notifications]} onCheckedChange={(checked) => setNotifications({ ...notifications, [key]: checked })} />
                      </div>
                    ))}
                  </div>
                  <Button onClick={saveNotificationPreferences} disabled={loading} className="w-full">
                    {loading ? "Saving..." : "Save Preferences"}
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-1 text-foreground font-playfair flex items-center gap-2"><Shield className="w-5 h-5 text-primary" />Security Settings</h3>
                    <p className="text-sm text-muted-foreground">Manage your account security</p>
                  </div>
                  <Separator />
                  <div className="space-y-6">
                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <Label className="flex items-center gap-2"><Mail className="w-4 h-4" />Password Reset</Label>
                          <p className="text-sm text-muted-foreground">Send a password reset link to your email</p>
                        </div>
                        <Button onClick={handlePasswordReset} variant="outline">Reset</Button>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="space-y-2">
                        <Label>Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground mb-3">Add an extra layer of security</p>
                        <Button variant="outline" disabled>Coming Soon</Button>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                      <div className="space-y-2">
                        <Label className="text-destructive">Danger Zone</Label>
                        <p className="text-sm text-muted-foreground mb-3">Permanently delete your account and all data</p>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive"><Trash2 className="w-4 h-4 mr-2" />Delete Account</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-destructive">Delete Account?</AlertDialogTitle>
                              <AlertDialogDescription>This action cannot be undone. All your data will be permanently deleted.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Forever</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="data">
              <Card className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-1 text-foreground font-playfair flex items-center gap-2"><Database className="w-5 h-5 text-primary" />Data Management</h3>
                    <p className="text-sm text-muted-foreground">Export and manage your data</p>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="space-y-2">
                        <Label>Export Your Data</Label>
                        <p className="text-sm text-muted-foreground mb-3">Download a copy of your account data</p>
                        <Button onClick={handleExportData} disabled={loading} variant="outline"><Download className="w-4 h-4 mr-2" />{loading ? "Exporting..." : "Export Data"}</Button>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="space-y-2">
                        <Label>Storage Usage</Label>
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Documents & Designs</span>
                            <span className="text-foreground font-medium">{(storageUsage.used / 1024 / 1024 / 1024).toFixed(2)} GB / {(storageUsage.total / 1024 / 1024 / 1024).toFixed(0)} GB</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-500 rounded-full" style={{ width: `${Math.min((storageUsage.used / storageUsage.total) * 100, 100)}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="audit">
              <AuditTrailViewer />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Settings;
