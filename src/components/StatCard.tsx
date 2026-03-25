import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  trend: "up" | "down";
}

const StatCard = ({ title, value, change, icon: Icon, trend }: StatCardProps) => {
  return (
    <Card className="p-6 bg-card border border-border hover:shadow-md transition-all duration-200 cursor-pointer">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-2">{title}</p>
          <h3 className="text-3xl font-bold mb-1 text-foreground font-playfair">{value}</h3>
          <p className={`text-sm ${trend === "up" ? "text-green-600" : "text-destructive"}`}>
            {change}
          </p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
