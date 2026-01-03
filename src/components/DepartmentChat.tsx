import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, Users } from "lucide-react";
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

interface DepartmentChatProps {
  userDepartment?: DepartmentType | null;
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

export const DepartmentChat = ({ userDepartment }: DepartmentChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentType | "admin">("management");
  const [loading, setLoading] = useState(false);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();

    // Set up realtime subscription
    const channel = supabase
      .channel("department-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "department_messages",
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDepartment, userDepartment]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    if (!userDepartment && !isAdmin) return;

    try {
      let query = supabase
        .from("department_messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (isAdmin) {
        // Admin sees messages to/from management or selected department
        query = query.or(
          `sender_department.eq.${selectedDepartment},recipient_department.eq.${selectedDepartment}`
        );
      } else if (userDepartment) {
        // Team member sees messages involving their department
        query = query.or(
          `sender_department.eq.${userDepartment},recipient_department.eq.${userDepartment}`
        );
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      // Fetch sender names
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
      const messageData: {
        sender_id: string;
        sender_department: DepartmentType;
        recipient_department: DepartmentType;
        message: string;
      } = {
        sender_id: user.id,
        sender_department: isAdmin ? "management" : (userDepartment as DepartmentType),
        recipient_department: selectedDepartment === "admin" ? "management" : selectedDepartment,
        message: newMessage.trim(),
      };

      const { error } = await supabase.from("department_messages").insert([messageData]);

      if (error) throw error;

      setNewMessage("");
      
      // Log activity
      await supabase.from("team_activity").insert([
        {
          user_id: user.id,
          activity_type: "message",
          description: `Sent message to ${departmentLabels[messageData.recipient_department]}`,
        },
      ]);
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

  const departments: (DepartmentType | "admin")[] = [
    "management",
    "financial",
    "graphic_design",
    "developers",
    "advertising",
    "compliance",
  ];

  return (
    <Card className="bg-cyber-gray/50 border-2 border-cyber-blue/30 h-[400px] flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-orbitron text-cyber-blue flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          DEPARTMENT CHAT
        </CardTitle>
        <div className="flex items-center gap-2 mt-2">
          <Users className="h-4 w-4 text-cyber-green" />
          <Select
            value={selectedDepartment}
            onValueChange={(value) => setSelectedDepartment(value as DepartmentType | "admin")}
          >
            <SelectTrigger className="w-full bg-cyber-gray border-cyber-blue/30">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent className="bg-cyber-gray border-cyber-blue/30">
              {departments
                .filter((dept) => dept !== userDepartment)
                .map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept === "admin" ? "Admin" : departmentLabels[dept as DepartmentType]}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden p-4">
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
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
                      className={`max-w-[80%] rounded-lg p-3 ${
                        isOwn
                          ? "bg-cyber-blue/20 border border-cyber-blue/50"
                          : "bg-cyber-gray border border-cyber-green/30"
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
        <div className="flex gap-2 mt-4">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="bg-cyber-gray border-cyber-blue/30 font-share-tech"
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !newMessage.trim()}
            className="bg-cyber-blue/20 border border-cyber-blue hover:bg-cyber-blue/30"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
