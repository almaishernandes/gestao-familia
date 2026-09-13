import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm",
        className
      )}
      {...props}
    />
  );
}
