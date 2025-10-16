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
    <Card className="p-6 bg-gradient-card border-border hover:border-gold/50 transition-all duration-300 shadow-card hover:shadow-gold group cursor-pointer">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-2">{title}</p>
          <h3 className="text-3xl font-bold mb-1">{value}</h3>
          <p className={`text-sm ${trend === "up" ? "text-gold" : "text-destructive"}`}>
            {change}
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-gold/10 transition-colors">
          <Icon className="h-6 w-6 text-gold" />
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
