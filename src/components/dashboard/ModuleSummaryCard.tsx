import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export type ModuleAccent = "sage" | "terracotta" | "slate" | "rose" | "sky" | "amber" | "violet";

interface ModuleSummaryCardProps {
  icon: LucideIcon;
  title: string;
  accent: ModuleAccent;
  metric: string;
  subtext: string;
  progress?: number; // 0-100
  onClick?: () => void;
}

const GRADIENTS: Record<ModuleAccent, string> = {
  sage: "from-sage-400 to-sage-600",
  terracotta: "from-terracotta-400 to-terracotta-600",
  slate: "from-slate-400 to-slate-600",
  rose: "from-rose-400 to-rose-600",
  sky: "from-sky-400 to-sky-600",
  amber: "from-amber-400 to-amber-600",
  violet: "from-violet-400 to-violet-600",
};

const BARS: Record<ModuleAccent, string> = {
  sage: "bg-sage-500",
  terracotta: "bg-terracotta-500",
  slate: "bg-slate-500",
  rose: "bg-rose-500",
  sky: "bg-sky-500",
  amber: "bg-amber-500",
  violet: "bg-violet-500",
};

export function ModuleSummaryCard({
  icon: Icon,
  title,
  accent,
  metric,
  subtext,
  progress,
  onClick,
}: ModuleSummaryCardProps) {
  return (
    <Card
      onClick={onClick}
      className="p-5 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "h-11 w-11 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-sm",
            GRADIENTS[accent]
          )}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300" />
      </div>
      <h3 className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
      <p className="font-display text-2xl font-semibold text-slate-900 dark:text-white mt-0.5">{metric}</p>
      <p className="text-xs text-slate-400 mt-1">{subtext}</p>
      {progress !== undefined && (
        <div className="mt-3 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
          <div
            className={cn("h-full rounded-full", BARS[accent])}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </Card>
  );
}
