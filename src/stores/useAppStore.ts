import { create } from "zustand";
import type { FamilyMember, ModuleKey } from "@/types/domain";

interface AppState {
  familyId: string | null;
  currentUserId: string | null;
  members: FamilyMember[];
  activeModule: ModuleKey;
  theme: "light" | "dark";
  setActiveModule: (m: ModuleKey) => void;
  toggleTheme: () => void;
  setFamilyContext: (familyId: string, userId: string, members: FamilyMember[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  familyId: null,
  currentUserId: null,
  members: [],
  activeModule: "dashboard",
  theme: "light",
  setActiveModule: (m) => set({ activeModule: m }),
  toggleTheme: () => set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
  setFamilyContext: (familyId, userId, members) =>
    set({ familyId, currentUserId: userId, members }),
}));
