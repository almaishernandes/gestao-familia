import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useToastStore } from "@/stores/useToastStore";
import { cn } from "@/lib/utils";

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };
const STYLES = {
  success: "border-sage-200 bg-sage-50 text-sage-700 dark:bg-sage-600/10 dark:border-sage-600/30 dark:text-sage-300",
  error:
    "border-terracotta-200 bg-terracotta-50 text-terracotta-600 dark:bg-terracotta-600/10 dark:border-terracotta-600/30 dark:text-terracotta-300",
  info: "border-slate-200 bg-white text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200",
};

export function ToastHost() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[92vw] max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = ICONS[toast.variant];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              className={cn(
                "pointer-events-auto flex items-start gap-2.5 rounded-xl border shadow-lg px-4 py-3 text-sm font-medium",
                STYLES[toast.variant]
              )}
            >
              <Icon className="h-5 w-5 shrink-0 mt-0.5" />
              <span className="flex-1">{toast.message}</span>
              <button onClick={() => dismiss(toast.id)} className="opacity-60 hover:opacity-100">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
