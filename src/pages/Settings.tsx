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
import { User, Bell, Shield, Database, Mail, Download, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Settings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    department: "",
    avatar_url: "",
  });
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    updates: true,
    security: true,
  });
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 10737418240 }); // 10GB in bytes

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchNotificationPreferences();
      fetchStorageUsage();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProfile({
          full_name: data.full_name || "",
          department: data.department || "",
          avatar_url: data.avatar_url || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const updateProfile = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("profiles")
        .update(profile)
        .eq("id", user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
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

  const fetchNotificationPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("user_preferences" as any)
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setNotifications({
          email: (data as any).email_notifications ?? true,
          push: (data as any).push_notifications ?? false,
          updates: (data as any).project_updates ?? true,
          security: (data as any).security_alerts ?? true,
        });
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    }
  };

  const fetchStorageUsage = async () => {
    try {
      const { data: documents } = await supabase
        .from("documents")
        .select("file_size")
        .eq("created_by", user?.id);

      const { data: designs } = await supabase
        .from("designs")
        .select("file_size")
        .eq("created_by", user?.id);

      const totalUsed = [
        ...(documents || []),
        ...(designs || []),
      ].reduce((sum, item) => sum + (item.file_size || 0), 0);

      setStorageUsage({ ...storageUsage, used: totalUsed });
    } catch (error) {
      console.error("Error fetching storage:", error);
    }
  };

  const saveNotificationPreferences = async () => {
    try {
      setLoading(true);
      const { data: existing } = await supabase
        .from("user_preferences" as any)
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      const preferenceData = {
        user_id: user?.id,
        email_notifications: notifications.email,
        push_notifications: notifications.push,
        project_updates: notifications.updates,
        security_alerts: notifications.security,
      };

      if (existing) {
        const { error } = await supabase
          .from("user_preferences" as any)
          .update(preferenceData)
          .eq("user_id", user?.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_preferences" as any)
          .insert([preferenceData]);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Notification preferences saved",
      });
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

  const handlePasswordReset = async () => {
    try {
      if (!user?.email) return;

      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for password reset instructions",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleExportData = async () => {
    try {
      setLoading(true);

      // Fetch all user data
      const [profileData, projectsData, clientsData, documentsData, designsData, tasksData] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user?.id).maybeSingle(),
        supabase.from("projects").select("*").eq("created_by", user?.id),
        supabase.from("clients").select("*").eq("created_by", user?.id),
        supabase.from("documents").select("*").eq("created_by", user?.id),
        supabase.from("designs").select("*").eq("created_by", user?.id),
        supabase.from("tasks").select("*").eq("created_by", user?.id),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          id: user?.id,
          email: user?.email,
        },
        profile: profileData.data,
        projects: projectsData.data || [],
        clients: clientsData.data || [],
        documents: documentsData.data || [],
        designs: designsData.data || [],
        tasks: tasksData.data || [],
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Your data has been exported successfully",
      });
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

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);

      // Delete all user data
      await Promise.all([
        supabase.from("tasks").delete().eq("created_by", user?.id),
        supabase.from("documents").delete().eq("created_by", user?.id),
        supabase.from("designs").delete().eq("created_by", user?.id),
        supabase.from("projects").delete().eq("created_by", user?.id),
        supabase.from("clients").delete().eq("created_by", user?.id),
        supabase.from("user_preferences" as any).delete().eq("user_id", user?.id),
      ]);

      // Sign out user
      await supabase.auth.signOut();

      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted",
      });
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

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(0,191,255,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,191,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,191,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <Navigation />
      <Header />

      <main className="ml-20 pt-16 p-8 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8 animate-slide-up">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-1 w-12 bg-gradient-to-r from-cyber-blue to-cyber-green" />
              <span className="text-cyber-green font-share-tech text-sm tracking-wider">
                ▸ SYSTEM CONFIGURATION
              </span>
            </div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyber-blue-glow via-white to-cyber-green-glow bg-clip-text text-transparent font-orbitron">
              SETTINGS & PREFERENCES
            </h1>
            <p className="text-cyber-blue font-share-tech">
              CONFIGURE YOUR OPERATIONAL PARAMETERS
            </p>
          </div>

          {/* Settings Tabs */}
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="bg-cyber-gray border border-cyber-blue/30">
              <TabsTrigger value="profile" className="font-share-tech">
                <User className="w-4 h-4 mr-2" />
                PROFILE
              </TabsTrigger>
              <TabsTrigger value="notifications" className="font-share-tech">
                <Bell className="w-4 h-4 mr-2" />
                ALERTS
              </TabsTrigger>
              <TabsTrigger value="security" className="font-share-tech">
                <Shield className="w-4 h-4 mr-2" />
                SECURITY
              </TabsTrigger>
              <TabsTrigger value="data" className="font-share-tech">
                <Database className="w-4 h-4 mr-2" />
                DATA
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="p-6 bg-gradient-cyber border-2 border-cyber-blue/30 shadow-cyber-glow">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold mb-4 text-cyber-blue font-orbitron flex items-center gap-2">
                      <User className="w-5 h-5" />
                      USER PROFILE
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 font-share-tech">
                      Update your personal information and preferences
                    </p>
                  </div>

                  <Separator className="bg-cyber-blue/20" />

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-cyber-blue font-share-tech">
                        EMAIL ADDRESS
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="bg-cyber-gray/50 border-cyber-blue/30 text-white font-mono"
                      />
                      <p className="text-xs text-muted-foreground font-share-tech">
                        Email cannot be changed
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="text-cyber-blue font-share-tech">
                        FULL NAME
                      </Label>
                      <Input
                        id="full_name"
                        value={profile.full_name}
                        onChange={(e) =>
                          setProfile({ ...profile, full_name: e.target.value })
                        }
                        className="bg-cyber-gray/50 border-cyber-blue/30 text-white font-mono focus:border-cyber-blue focus:ring-cyber-blue"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department" className="text-cyber-blue font-share-tech">
                        DEPARTMENT
                      </Label>
                      <Input
                        id="department"
                        value={profile.department}
                        onChange={(e) =>
                          setProfile({ ...profile, department: e.target.value })
                        }
                        className="bg-cyber-gray/50 border-cyber-blue/30 text-white font-mono focus:border-cyber-blue focus:ring-cyber-blue"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="avatar_url" className="text-cyber-blue font-share-tech">
                        AVATAR URL
                      </Label>
                      <Input
                        id="avatar_url"
                        value={profile.avatar_url}
                        onChange={(e) =>
                          setProfile({ ...profile, avatar_url: e.target.value })
                        }
                        placeholder="https://example.com/avatar.jpg"
                        className="bg-cyber-gray/50 border-cyber-blue/30 text-white font-mono focus:border-cyber-blue focus:ring-cyber-blue"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={updateProfile}
                    disabled={loading}
                    className="w-full bg-cyber-blue/20 hover:bg-cyber-blue/30 border-2 border-cyber-blue text-cyber-blue-glow font-share-tech"
                  >
                    {loading ? "UPDATING..." : "SAVE CHANGES"}
                  </Button>
                </div>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card className="p-6 bg-gradient-cyber border-2 border-cyber-green/30">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold mb-4 text-cyber-green font-orbitron flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      NOTIFICATION PREFERENCES
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 font-share-tech">
                      Manage how you receive alerts and updates
                    </p>
                  </div>

                  <Separator className="bg-cyber-green/20" />

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-white font-share-tech">EMAIL NOTIFICATIONS</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch
                        checked={notifications.email}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, email: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-white font-share-tech">PUSH NOTIFICATIONS</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive browser push notifications
                        </p>
                      </div>
                      <Switch
                        checked={notifications.push}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, push: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-white font-share-tech">PROJECT UPDATES</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified about project changes
                        </p>
                      </div>
                      <Switch
                        checked={notifications.updates}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, updates: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-white font-share-tech">SECURITY ALERTS</Label>
                        <p className="text-sm text-muted-foreground">
                          Critical security notifications
                        </p>
                      </div>
                      <Switch
                        checked={notifications.security}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, security: checked })
                        }
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={saveNotificationPreferences}
                    disabled={loading}
                    className="w-full bg-cyber-green/20 hover:bg-cyber-green/30 border-2 border-cyber-green text-cyber-green font-share-tech"
                  >
                    {loading ? "SAVING..." : "SAVE PREFERENCES"}
                  </Button>
                </div>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <Card className="p-6 bg-gradient-cyber border-2 border-cyber-blue/30 shadow-cyber-glow">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold mb-4 text-cyber-blue font-orbitron flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      SECURITY SETTINGS
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 font-share-tech">
                      Manage your account security and access
                    </p>
                  </div>

                  <Separator className="bg-cyber-blue/20" />

                  <div className="space-y-6">
                    <div className="p-4 rounded-lg bg-cyber-gray/30 border border-cyber-blue/30">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <Label className="text-cyber-blue font-share-tech flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            PASSWORD RESET
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Send a password reset link to your email
                          </p>
                        </div>
                        <Button
                          onClick={handlePasswordReset}
                          variant="outline"
                          className="border-cyber-blue text-cyber-blue hover:bg-cyber-blue/20 font-share-tech"
                        >
                          RESET
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-cyber-gray/30 border border-cyber-blue/30">
                      <div className="space-y-2">
                        <Label className="text-cyber-blue font-share-tech">
                          TWO-FACTOR AUTHENTICATION
                        </Label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Add an extra layer of security to your account
                        </p>
                        <Button
                          variant="outline"
                          disabled
                          className="border-cyber-blue/50 text-cyber-blue/50 font-share-tech"
                        >
                          COMING SOON
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-cyber-gray/30 border border-red-500/30">
                      <div className="space-y-2">
                        <Label className="text-red-400 font-share-tech">DANGER ZONE</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Permanently delete your account and all data
                        </p>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="border-red-500 text-red-400 hover:bg-red-500/20 font-share-tech"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              DELETE ACCOUNT
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-cyber-gray border-2 border-red-500/30">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-red-400 font-orbitron">
                                Delete Account?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-muted-foreground">
                                This action cannot be undone. This will permanently delete your
                                account and remove all your data from our servers including
                                projects, clients, documents, and designs.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-cyber-blue text-cyber-blue hover:bg-cyber-blue/20">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleDeleteAccount}
                                className="bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500 text-red-400"
                              >
                                Delete Forever
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Data Tab */}
            <TabsContent value="data">
              <Card className="p-6 bg-gradient-cyber border-2 border-cyber-green/30">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold mb-4 text-cyber-green font-orbitron flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      DATA MANAGEMENT
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 font-share-tech">
                      Export and manage your data
                    </p>
                  </div>

                  <Separator className="bg-cyber-green/20" />

                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-cyber-gray/30 border border-cyber-green/30">
                      <div className="space-y-2">
                        <Label className="text-cyber-green font-share-tech">
                          EXPORT YOUR DATA
                        </Label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Download a copy of your account data
                        </p>
                        <Button
                          onClick={handleExportData}
                          disabled={loading}
                          variant="outline"
                          className="border-cyber-green text-cyber-green hover:bg-cyber-green/20 font-share-tech"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {loading ? "EXPORTING..." : "EXPORT DATA"}
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-cyber-gray/30 border border-cyber-green/30">
                      <div className="space-y-2">
                        <Label className="text-cyber-green font-share-tech">STORAGE USAGE</Label>
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Documents & Designs</span>
                            <span className="text-cyber-green font-mono">
                              {(storageUsage.used / 1024 / 1024 / 1024).toFixed(2)} GB / {(storageUsage.total / 1024 / 1024 / 1024).toFixed(0)} GB
                            </span>
                          </div>
                          <div className="h-2 bg-cyber-gray rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyber-green to-cyber-blue transition-all duration-500"
                              style={{ width: `${Math.min((storageUsage.used / storageUsage.total) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Settings;
