import { NAV_ITEMS, MOBILE_TAB_KEYS } from "./navConfig";
import { useAppStore } from "@/stores/useAppStore";
import { cn } from "@/lib/utils";

export function MobileTabBar() {
  const { activeModule, setActiveModule } = useAppStore();
  const items = NAV_ITEMS.filter((i) => MOBILE_TAB_KEYS.includes(i.key));

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur border-t border-slate-100 dark:border-slate-700 flex justify-around items-stretch h-16 px-1 z-40"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = activeModule === item.key;
        return (
          <button
            key={item.key}
            onClick={() => setActiveModule(item.key)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 active:opacity-60"
          >
            <Icon
              className={cn("h-6 w-6", active ? "text-sage-500" : "text-slate-400 dark:text-slate-500")}
            />
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
    </nav>
  );
}
