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
    <Card className="p-6 bg-gradient-cyber border-2 border-cyber-blue/30 hover:border-cyber-blue transition-all duration-300 shadow-cyber-glow hover:shadow-[0_0_40px_rgba(0,191,255,0.5)] group cursor-pointer relative overflow-hidden">
      {/* Corner accents */}
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyber-green opacity-50" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyber-green opacity-50" />
      
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm text-cyber-blue font-share-tech mb-2 tracking-wider">{title.toUpperCase()}</p>
          <h3 className="text-4xl font-bold mb-1 font-orbitron text-white">{value}</h3>
          <p className={`text-sm font-share-tech ${trend === "up" ? "text-cyber-green" : "text-destructive"}`}>
            {change}
          </p>
        </div>
        <div className="w-14 h-14 rounded-xl bg-cyber-gray border-2 border-cyber-blue/50 flex items-center justify-center group-hover:bg-cyber-blue/10 group-hover:shadow-[0_0_20px_rgba(0,191,255,0.3)] transition-all">
          <Icon className="h-7 w-7 text-cyber-blue-glow" />
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
