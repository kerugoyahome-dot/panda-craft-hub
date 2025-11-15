import { cn } from "@/lib/utils";

interface PresenceIndicatorProps {
  isOnline: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const PresenceIndicator = ({ 
  isOnline, 
  size = "md",
  className 
}: PresenceIndicatorProps) => {
  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4"
  };

  return (
    <span
      className={cn(
        "rounded-full border-2 border-background",
        sizeClasses[size],
        isOnline ? "bg-green-500 animate-pulse" : "bg-muted",
        className
      )}
      title={isOnline ? "Online" : "Offline"}
    />
  );
};
