import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, X, Users, Bell, Loader2, Paperclip, FileText, Image as ImageIcon, Download } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type DepartmentType = Database["public"]["Enums"]["department_type"];

interface Message {
  id: string;
  sender_id: string;
  sender_department: DepartmentType;
  recipient_department: DepartmentType;
  message: string;
  read: boolean;
  created_at: string;
  sender_name?: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
}

const departmentLabels: Record<DepartmentType, string> = {
  financial: "Financial",
  graphic_design: "Graphic Design",
  developers: "Developers",
  advertising: "Advertising",
  compliance: "Compliance",
  management: "Management",
  records_management: "Records Management",
};

const departments: DepartmentType[] = [
  "management",
  "financial",
  "graphic_design",
  "developers",
  "advertising",
  "compliance",
  "records_management",
];

export const FloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentType>("management");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userDepartment, setUserDepartment] = useState<DepartmentType | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user) {
      fetchUserDepartment();
    }
  }, [user]);

  useEffect(() => {
    if (userDepartment || isAdmin) {
      fetchMessages();
      fetchUnreadCount();

      // Subscribe to real-time updates
      const channel = supabase
        .channel("floating-chat-realtime")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "department_messages",
          },
          async (payload) => {
            const newMsg = payload.new as Message;
            
            // Check if this message is relevant to current user
            const senderDept = newMsg.sender_department;
            const recipientDept = newMsg.recipient_department;
            const isRelevant = isAdmin 
              ? true 
              : (senderDept === userDepartment || recipientDept === userDepartment);
            
            if (!isRelevant) return;
            
            // Get sender name
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", newMsg.sender_id)
              .single();
            
            const msgWithName = { ...newMsg, sender_name: profile?.full_name || "Unknown" };
            
            // Add to messages if viewing relevant conversation
            const isCurrentConversation = isAdmin
              ? (senderDept === selectedDepartment || recipientDept === selectedDepartment)
              : (senderDept === selectedDepartment || recipientDept === selectedDepartment) && 
                (senderDept === userDepartment || recipientDept === userDepartment);
            
            if (isCurrentConversation) {
              setMessages((prev) => {
                // Avoid duplicates
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, msgWithName];
              });
            }
            
            // Show notification if message is for user and not from user
            if (newMsg.sender_id !== user?.id && !isOpen) {
              setUnreadCount((prev) => prev + 1);
              toast({
                title: `Message from ${departmentLabels[senderDept]}`,
                description: newMsg.message.substring(0, 100),
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedDepartment, userDepartment, isAdmin, isOpen, user]);

  useEffect(() => {
    if (isOpen) {
      markMessagesAsRead();
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Refetch messages when selected department changes
  useEffect(() => {
    if (userDepartment || isAdmin) {
      fetchMessages();
    }
  }, [selectedDepartment]);

  const fetchUserDepartment = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("department_type")
      .eq("id", user.id)
      .single();
    if (data?.department_type) {
      setUserDepartment(data.department_type as DepartmentType);
    }
  };

  const fetchUnreadCount = async () => {
    if (!user) return;
    
    let query = supabase
      .from("department_messages")
      .select("id", { count: "exact", head: true })
      .eq("read", false)
      .neq("sender_id", user.id);
    
    if (!isAdmin && userDepartment) {
      query = query.eq("recipient_department", userDepartment);
    }
    
    const { count } = await query;
    setUnreadCount(count || 0);
  };

  const markMessagesAsRead = async () => {
    if (!user) return;
    
    let query = supabase
      .from("department_messages")
      .update({ read: true })
      .eq("read", false)
      .neq("sender_id", user.id);
    
    if (!isAdmin && userDepartment) {
      query = query.eq("recipient_department", userDepartment);
    }
    
    await query;
  };

  const fetchMessages = async () => {
    if (!userDepartment && !isAdmin) return;

    setLoading(true);
    try {
      // Fetch messages between current user's department and selected department
      let query = supabase
        .from("department_messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (isAdmin) {
        // Admin can see all messages involving the selected department
        query = query.or(
          `sender_department.eq.${selectedDepartment},recipient_department.eq.${selectedDepartment}`
        );
      } else if (userDepartment) {
        // User can see messages between their department and selected department
        query = query.or(
          `and(sender_department.eq.${userDepartment},recipient_department.eq.${selectedDepartment}),and(sender_department.eq.${selectedDepartment},recipient_department.eq.${userDepartment})`
        );
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;

      // Get sender names
      const messagesWithNames = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", msg.sender_id)
            .single();
          return { ...msg, sender_name: profile?.full_name || "Unknown" };
        })
      );

      setMessages(messagesWithNames);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !user) return;
    if (!userDepartment && !isAdmin) {
      toast({
        title: "Error",
        description: "You must be assigned to a department to send messages",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    setUploading(selectedFile !== null);
    
    try {
      const senderDept = isAdmin ? ("management" as DepartmentType) : userDepartment!;
      
      let attachmentUrl: string | null = null;
      let attachmentName: string | null = null;
      let attachmentType: string | null = null;

      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("department-attachments")
          .upload(fileName, selectedFile);
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from("department-attachments")
          .getPublicUrl(uploadData.path);
        
        attachmentUrl = urlData.publicUrl;
        attachmentName = selectedFile.name;
        attachmentType = selectedFile.type;
      }
      
      const messageData = {
        sender_id: user.id,
        sender_department: senderDept,
        recipient_department: selectedDepartment,
        message: newMessage.trim() || (selectedFile ? `Shared: ${selectedFile.name}` : ""),
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
        attachment_type: attachmentType,
      };

      const { error } = await supabase.from("department_messages").insert([messageData]);

      if (error) throw error;

      // Log activity
      await supabase.from("team_activity").insert([
        {
          user_id: user.id,
          activity_type: selectedFile ? "file_share" : "message",
          description: selectedFile 
            ? `Shared file "${selectedFile.name}" with ${departmentLabels[selectedDepartment]}`
            : `Sent message to ${departmentLabels[selectedDepartment]}`,
        },
      ]);

      setNewMessage("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 10MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const getAttachmentUrl = (url: string) => url;

  const isImageAttachment = (type: string | null | undefined) => {
    return type?.startsWith("image/");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) return null;

  const availableDepartments = departments.filter((dept) => 
    isAdmin ? true : dept !== userDepartment
  );

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-cyber-blue/20 border-2 border-cyber-blue hover:bg-cyber-blue/30 transition-all shadow-[0_0_20px_rgba(0,191,255,0.4)] hover:shadow-[0_0_30px_rgba(0,191,255,0.6)] flex items-center justify-center group"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-cyber-blue" />
        ) : (
          <>
            <MessageSquare className="h-6 w-6 text-cyber-blue" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold animate-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[520px] bg-cyber-gray/95 backdrop-blur-xl border-2 border-cyber-blue/50 rounded-xl shadow-[0_0_40px_rgba(0,191,255,0.3)] flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="p-4 border-b border-cyber-blue/30 bg-black/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-orbitron text-cyber-blue flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                DEPARTMENT CHAT
              </h3>
              {unreadCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-cyber-green bg-cyber-green/20 px-2 py-1 rounded-full">
                  <Bell className="h-3 w-3" />
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-cyber-green" />
              <Select
                value={selectedDepartment}
                onValueChange={(value) => setSelectedDepartment(value as DepartmentType)}
              >
                <SelectTrigger className="w-full bg-cyber-gray border-cyber-blue/30 text-sm">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="bg-cyber-gray border-cyber-blue/30">
                  {availableDepartments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {departmentLabels[dept]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {userDepartment && (
              <p className="text-xs text-muted-foreground mt-2 font-share-tech">
                Chatting as: <span className="text-cyber-green">{departmentLabels[userDepartment]}</span>
              </p>
            )}
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 text-cyber-blue animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-muted-foreground font-share-tech py-8">
                  No messages yet. Start a conversation with {departmentLabels[selectedDepartment]}!
                </p>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg p-3 ${
                          isOwn
                            ? "bg-cyber-blue/20 border border-cyber-blue/50"
                            : "bg-black/50 border border-cyber-green/30"
                        }`}
                      >
                        <p className={`text-xs font-share-tech mb-1 ${isOwn ? "text-cyber-blue" : "text-cyber-green"}`}>
                          {isOwn ? "You" : msg.sender_name} •{" "}
                          {departmentLabels[msg.sender_department]}
                        </p>
                        
                        {/* Attachment Preview */}
                        {msg.attachment_url && (
                          <div className="mb-2">
                            {isImageAttachment(msg.attachment_type) ? (
                              <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={msg.attachment_url}
                                  alt={msg.attachment_name || "Attachment"}
                                  className="max-w-full max-h-32 rounded-lg border border-white/20 hover:border-cyber-blue transition-colors"
                                />
                              </a>
                            ) : (
                              <a
                                href={msg.attachment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 rounded-lg bg-black/30 border border-white/20 hover:border-cyber-blue transition-colors"
                              >
                                <FileText className="h-4 w-4 text-cyber-blue" />
                                <span className="text-xs text-white truncate max-w-[150px]">
                                  {msg.attachment_name || "Attachment"}
                                </span>
                                <Download className="h-3 w-3 text-muted-foreground" />
                              </a>
                            )}
                          </div>
                        )}
                        
                        {msg.message && !msg.message.startsWith("Shared:") && (
                          <p className="text-sm text-white whitespace-pre-wrap">{msg.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(msg.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-cyber-blue/30 bg-black/50">
            {/* Selected File Preview */}
            {selectedFile && (
              <div className="flex items-center gap-2 mb-2 p-2 bg-cyber-blue/10 rounded-lg border border-cyber-blue/30">
                <Paperclip className="h-4 w-4 text-cyber-blue" />
                <span className="text-xs text-white truncate flex-1">{selectedFile.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-white"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
                className="text-cyber-blue hover:bg-cyber-blue/20"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message ${departmentLabels[selectedDepartment]}...`}
                className="bg-cyber-gray border-cyber-blue/30 font-share-tech text-sm"
                onKeyPress={handleKeyPress}
                disabled={sending}
              />
              <Button
                onClick={sendMessage}
                disabled={sending || (!newMessage.trim() && !selectedFile)}
                size="sm"
                className="bg-cyber-blue/20 border border-cyber-blue hover:bg-cyber-blue/30"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            {uploading && (
              <p className="text-xs text-cyber-blue mt-2 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Uploading file...
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};
