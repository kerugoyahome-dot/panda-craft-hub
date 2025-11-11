import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface LockScreenProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LockScreen = ({ open, onOpenChange }: LockScreenProps) => {
  const [pin, setPin] = useState("");
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (open && user) {
      checkStoredPin();
    }
  }, [open, user]);

  const checkStoredPin = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user?.id)
      .maybeSingle();

    // We'll store the PIN in avatar_url temporarily (in production, use a dedicated column)
    const savedPin = data?.avatar_url;
    if (!savedPin || savedPin.length !== 4) {
      setIsSettingPin(true);
      setStoredPin(null);
    } else {
      setStoredPin(savedPin);
      setIsSettingPin(false);
    }
  };

  const handleComplete = async (value: string) => {
    setPin(value);
    
    if (isSettingPin) {
      // Save new PIN
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: value })
        .eq("id", user?.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to set PIN",
          variant: "destructive",
        });
      } else {
        toast({
          title: "PIN Set",
          description: "Your lock screen PIN has been set",
        });
        setStoredPin(value);
        setIsSettingPin(false);
        onOpenChange(false);
        setPin("");
      }
    } else {
      // Verify PIN
      if (value === storedPin) {
        toast({
          title: "Unlocked",
          description: "Access granted",
        });
        onOpenChange(false);
        setPin("");
      } else {
        toast({
          title: "Access Denied",
          description: "Incorrect PIN",
          variant: "destructive",
        });
        setPin("");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-2 border-cyber-blue/50 text-white max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="flex flex-col items-center justify-center py-12 space-y-8">
          {/* Logo */}
          <div className="relative">
            <div className="absolute inset-0 bg-cyber-blue/20 blur-3xl animate-pulse" />
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-cyber-blue/30 to-cyber-green/30 border-4 border-cyber-blue flex items-center justify-center shadow-[0_0_50px_rgba(0,191,255,0.5)]">
              <Shield className="w-16 h-16 text-cyber-blue-glow" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold font-orbitron text-cyber-blue-glow">
              PANDATECH SECURE ACCESS
            </h2>
            <p className="text-sm text-muted-foreground font-share-tech">
              {isSettingPin ? "▸ SET YOUR 4-DIGIT PIN" : "▸ ENTER PIN TO UNLOCK"}
            </p>
          </div>

          {/* PIN Input */}
          <div className="flex flex-col items-center space-y-4">
            <InputOTP
              maxLength={4}
              value={pin}
              onChange={setPin}
              onComplete={handleComplete}
            >
              <InputOTPGroup>
                <InputOTPSlot
                  index={0}
                  className="w-16 h-16 text-2xl border-2 border-cyber-blue/50 bg-cyber-gray/50 text-cyber-blue-glow font-orbitron"
                />
                <InputOTPSlot
                  index={1}
                  className="w-16 h-16 text-2xl border-2 border-cyber-blue/50 bg-cyber-gray/50 text-cyber-blue-glow font-orbitron"
                />
                <InputOTPSlot
                  index={2}
                  className="w-16 h-16 text-2xl border-2 border-cyber-blue/50 bg-cyber-gray/50 text-cyber-blue-glow font-orbitron"
                />
                <InputOTPSlot
                  index={3}
                  className="w-16 h-16 text-2xl border-2 border-cyber-blue/50 bg-cyber-gray/50 text-cyber-blue-glow font-orbitron"
                />
              </InputOTPGroup>
            </InputOTP>

            {!isSettingPin && (
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-cyber-blue hover:text-cyber-blue-glow font-share-tech"
              >
                CANCEL
              </Button>
            )}
          </div>

          {/* Corner accents */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cyber-blue/50" />
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-cyber-blue/50" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-cyber-blue/50" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-cyber-blue/50" />
        </div>
      </DialogContent>
    </Dialog>
  );
};
