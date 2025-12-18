import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, X, Users, Bell } from "lucide-react";
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
}

const departmentLabels: Record<DepartmentType, string> = {
  financial: "Financial",
  graphic_design: "Graphic Design",
  developers: "Developers",
  advertising: "Advertising",
  compliance: "Compliance",
  management: "Management",
};

export const FloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentType>("management");
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userDepartment, setUserDepartment] = useState<DepartmentType | null>(null);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchUserDepartment();
    }
  }, [user]);

  useEffect(() => {
    if (userDepartment || isAdmin) {
      fetchMessages();
      fetchUnreadCount();

      const channel = supabase
        .channel("floating-chat-messages")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "department_messages",
          },
          async (payload) => {
            const newMsg = payload.new as Message;
            
            // Get sender name
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", newMsg.sender_id)
              .single();
            
            const msgWithName = { ...newMsg, sender_name: profile?.full_name || "Unknown" };
            
            setMessages((prev) => [...prev, msgWithName]);
            
            // Show notification if message is for user and not from user
            if (newMsg.sender_id !== user?.id) {
              const isForUser = isAdmin 
                ? true 
                : newMsg.recipient_department === userDepartment;
              
              if (isForUser && !isOpen) {
                setUnreadCount((prev) => prev + 1);
                toast({
                  title: "New Message",
                  description: `${departmentLabels[newMsg.sender_department]}: ${newMsg.message.substring(0, 50)}...`,
                });
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedDepartment, userDepartment, isAdmin, isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      markMessagesAsRead();
    }
  }, [isOpen]);

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

    try {
      let query = supabase
        .from("department_messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (isAdmin) {
        query = query.or(
          `sender_department.eq.${selectedDepartment},recipient_department.eq.${selectedDepartment}`
        );
      } else if (userDepartment) {
        query = query.or(
          `sender_department.eq.${userDepartment},recipient_department.eq.${userDepartment}`
        );
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

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
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setLoading(true);
    try {
      const messageData = {
        sender_id: user.id,
        sender_department: isAdmin ? "management" as DepartmentType : userDepartment!,
        recipient_department: selectedDepartment,
        message: newMessage.trim(),
      };

      const { error } = await supabase.from("department_messages").insert([messageData]);

      if (error) throw error;

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const departments: DepartmentType[] = [
    "management",
    "financial",
    "graphic_design",
    "developers",
    "advertising",
    "compliance",
  ];

  if (!user) return null;

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
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[500px] bg-cyber-gray/95 backdrop-blur-xl border-2 border-cyber-blue/50 rounded-xl shadow-[0_0_40px_rgba(0,191,255,0.3)] flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="p-4 border-b border-cyber-blue/30 bg-black/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-orbitron text-cyber-blue flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                DEPARTMENT CHAT
              </h3>
              {unreadCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-cyber-green">
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
                  {departments
                    .filter((dept) => dept !== userDepartment)
                    .map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {departmentLabels[dept]}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-3">
              {messages.length === 0 ? (
                <p className="text-center text-muted-foreground font-share-tech py-8">
                  No messages yet. Start a conversation!
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
                        <p className="text-xs text-cyber-green font-share-tech mb-1">
                          {isOwn ? "You" : msg.sender_name} •{" "}
                          {departmentLabels[msg.sender_department]}
                        </p>
                        <p className="text-sm text-white">{msg.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-cyber-blue/30 bg-black/50">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="bg-cyber-gray border-cyber-blue/30 font-share-tech text-sm"
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              />
              <Button
                onClick={sendMessage}
                disabled={loading || !newMessage.trim()}
                size="sm"
                className="bg-cyber-blue/20 border border-cyber-blue hover:bg-cyber-blue/30"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
