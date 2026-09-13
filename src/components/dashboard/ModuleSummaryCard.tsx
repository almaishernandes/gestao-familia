import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface ModuleSummaryCardProps {
  icon: LucideIcon;
  title: string;
  accent: "sage" | "terracotta" | "slate";
  metric: string;
  subtext: string;
  progress?: number; // 0-100
  onClick?: () => void;
}

const ACCENTS = {
  sage: "bg-sage-50 text-sage-600 dark:bg-sage-600/20 dark:text-sage-400",
  terracotta: "bg-terracotta-50 text-terracotta-500 dark:bg-terracotta-600/20 dark:text-terracotta-400",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

const BARS = {
  sage: "bg-sage-500",
  terracotta: "bg-terracotta-500",
  slate: "bg-slate-500",
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
      className="p-5 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", ACCENTS[accent])}>
          <Icon className="h-5 w-5" />
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300" />
      </div>
      <h3 className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
      <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-0.5">{metric}</p>
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
