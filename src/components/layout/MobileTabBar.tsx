import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NAV_ITEMS, MOBILE_TAB_KEYS } from "./navConfig";
import { useAppStore } from "@/stores/useAppStore";
import { cn } from "@/lib/utils";

export function MobileTabBar() {
  const { activeModule, setActiveModule } = useAppStore();
  const [moreOpen, setMoreOpen] = useState(false);
  const primaryItems = NAV_ITEMS.filter((i) => MOBILE_TAB_KEYS.includes(i.key));
  const moreItems = NAV_ITEMS.filter((i) => !MOBILE_TAB_KEYS.includes(i.key));
  const moreActive = moreItems.some((i) => i.key === activeModule);

  function selectModule(key: (typeof NAV_ITEMS)[number]["key"]) {
    setActiveModule(key);
    setMoreOpen(false);
  }

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur border-t border-slate-100 dark:border-slate-700 flex justify-around items-stretch h-16 px-1 z-40"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const active = activeModule === item.key;
          return (
            <button
              key={item.key}
              onClick={() => selectModule(item.key)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 active:opacity-60"
            >
              <Icon className={cn("h-6 w-6", active ? "text-sage-500" : "text-slate-400 dark:text-slate-500")} />
              <span
                className={cn(
                  "text-[11px] font-medium",
                  active ? "text-sage-600 dark:text-sage-400" : "text-slate-400 dark:text-slate-500"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 active:opacity-60"
        >
          <Menu className={cn("h-6 w-6", moreActive ? "text-sage-500" : "text-slate-400 dark:text-slate-500")} />
          <span
            className={cn(
              "text-[11px] font-medium",
              moreActive ? "text-sage-600 dark:text-sage-400" : "text-slate-400 dark:text-slate-500"
            )}
          >
            Mais
          </span>
        </button>
      </nav>

      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="md:hidden fixed inset-0 bg-slate-900/30 z-50"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-slate-800 rounded-t-2xl z-50 pb-safe"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
            >
              <div className="flex items-center justify-between px-5 h-14 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-medium text-slate-900 dark:text-white">Mais módulos</h3>
                <button onClick={() => setMoreOpen(false)}>
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 p-5">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeModule === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => selectModule(item.key)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1.5 rounded-xl py-4 border",
                        active
                          ? "border-sage-400 bg-sage-50 dark:bg-sage-600/10 text-sage-600"
                          : "border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-300"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
