import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ThemeSwitcher = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="relative hover:bg-primary/10 hover:shadow-[0_0_15px_hsl(var(--primary)/0.3)] transition-all duration-300"
        >
          {theme === "cyber" ? (
            <Sun className="h-5 w-5 text-primary transition-transform hover:rotate-45" />
          ) : (
            <Moon className="h-5 w-5 text-primary transition-transform hover:-rotate-12" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent className="font-share-tech">
        <p>Switch to {theme === "cyber" ? "Normal" : "Cyber"} Theme</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default ThemeSwitcher;
