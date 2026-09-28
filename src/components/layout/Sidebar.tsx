import { useState } from "react";
import { Moon, Sun, Home, LogOut, ChevronDown } from "lucide-react";
import { NAV_ITEMS } from "./navConfig";
import { useAppStore } from "@/stores/useAppStore";
import { signOut } from "@/services/authService";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { activeModule, setActiveModule, theme, toggleTheme, members, currentUserId } = useAppStore();
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(currentUserId);

  function toggleMember(id: string) {
    setExpandedMemberId((prev) => (prev === id ? null : id));
  }

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 bg-sage-600 h-screen sticky top-0">
      <div
        className="flex items-center gap-2 px-6 h-16 border-b border-white/10 shrink-0"
        style={{ background: "linear-gradient(135deg, #003d33 0%, #00695c 60%, #00796b 100%)" }}
      >
        <div className="h-9 w-9 rounded-xl2 bg-terracotta-500 flex items-center justify-center">
          <Home className="h-5 w-5 text-sage-700" />
        </div>
        <span className="font-display font-semibold text-lg text-white">Agenda Família</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
        {members.map((member) => {
          const expanded = expandedMemberId === member.id;
          return (
            <div key={member.id}>
              <button
                onClick={() => toggleMember(member.id)}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                <Avatar name={member.fullName} src={member.avatarUrl} size="sm" />
                <span className="flex-1 text-left truncate">{member.fullName}</span>
                <ChevronDown className={cn("h-4 w-4 text-sage-50/70 transition-transform shrink-0", expanded && "rotate-180")} />
              </button>

              {expanded && (
                <div className="pl-4 mt-1 mb-2 space-y-0.5 border-l-2 border-white/10 ml-4">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const active = activeModule === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => setActiveModule(item.key)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                          active
                            ? "bg-terracotta-500 text-sage-700"
                            : "text-sage-50/80 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="m-3 space-y-1 border-t border-white/10 pt-3 shrink-0">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-sage-50/80 hover:bg-white/10 hover:text-white"
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          {theme === "light" ? "Modo escuro" : "Modo claro"}
        </button>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-sage-50/80 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </div>
    </aside>
  );
}
