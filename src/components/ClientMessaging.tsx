import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  project_id: string | null;
  message: string;
  is_admin_reply: boolean;
  created_at: string;
  sender_id: string;
}

interface ClientMessagingProps {
  clientId: string;
}

const ClientMessaging = ({ clientId }: ClientMessagingProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();

    // Set up real-time subscription
    const channel = supabase
      .channel('client-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `client_id=eq.${clientId}`
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    setMessages(data || []);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          client_id: clientId,
          sender_id: user.id,
          message: newMessage.trim(),
          is_admin_reply: false,
        });

      if (error) throw error;

      setNewMessage("");
      toast({
        title: "Message sent",
        description: "Your message has been sent to the admin team.",
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-cyber-gray/50 border-2 border-cyber-blue/30 shadow-[0_0_20px_rgba(0,191,255,0.1)]">
      <CardHeader>
        <CardTitle className="font-orbitron text-cyber-blue flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          MESSAGE ADMIN
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages Display */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {messages.length === 0 ? (
            <p className="text-muted-foreground font-share-tech text-center py-8">
              No messages yet. Start a conversation with the admin team!
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-lg ${
                  msg.is_admin_reply
                    ? "bg-cyber-blue/10 border-l-4 border-cyber-blue ml-4"
                    : "bg-cyber-gray/30 border-l-4 border-cyber-green mr-4"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold font-share-tech text-cyber-green">
                    {msg.is_admin_reply ? "ADMIN" : "YOU"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-white font-share-tech whitespace-pre-wrap">
                  {msg.message}
                </p>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="space-y-2">
          <Textarea
            placeholder="Type your message or question here..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="min-h-[100px] bg-cyber-gray/30 border-cyber-blue/30 text-white font-share-tech resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={loading || !newMessage.trim()}
            className="w-full bg-gradient-to-r from-cyber-blue to-cyber-green text-black font-bold font-share-tech hover:opacity-90 transition-all shadow-[0_0_15px_rgba(0,191,255,0.3)]"
          >
            <Send className="h-4 w-4 mr-2" />
            {loading ? "SENDING..." : "SEND MESSAGE"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientMessaging;
