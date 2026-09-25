import { Moon, Sun, Home, LogOut } from "lucide-react";
import { NAV_ITEMS } from "./navConfig";
import { useAppStore } from "@/stores/useAppStore";
import { signOut } from "@/services/authService";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { activeModule, setActiveModule, theme, toggleTheme } = useAppStore();

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 h-screen sticky top-0">
      <div className="flex items-center gap-2 px-6 h-16 border-b border-slate-100 dark:border-slate-700">
        <div className="h-9 w-9 rounded-xl2 bg-sage-500 flex items-center justify-center">
          <Home className="h-5 w-5 text-white" />
        </div>
        <span className="font-display font-semibold text-lg text-slate-900 dark:text-white">Agenda Família</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeModule === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveModule(item.key)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "bg-sage-50 text-sage-600 dark:bg-sage-600/20 dark:text-sage-400"
                  : "text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="m-3 space-y-1">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50"
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          {theme === "light" ? "Modo escuro" : "Modo claro"}
        </button>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </div>
    </aside>
  );
}
