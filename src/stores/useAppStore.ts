import { create } from "zustand";
import type { FamilyMember, ModuleKey } from "@/types/domain";

interface AppState {
  familyId: string | null;
  currentUserId: string | null;
  members: FamilyMember[];
  activeModule: ModuleKey;
  theme: "light" | "dark";
  selectedMemberId: string | null;
  setActiveModule: (m: ModuleKey) => void;
  toggleTheme: () => void;
  setFamilyContext: (familyId: string, userId: string, members: FamilyMember[]) => void;
  setSelectedMemberId: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  familyId: null,
  currentUserId: null,
  members: [],
  activeModule: "dashboard",
  theme: "light",
  selectedMemberId: null,
  setActiveModule: (m) => set({ activeModule: m }),
  toggleTheme: () => set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
  setFamilyContext: (familyId, userId, members) =>
    set((s) => ({ familyId, currentUserId: userId, members, selectedMemberId: s.selectedMemberId ?? userId })),
  setSelectedMemberId: (id) => set({ selectedMemberId: id }),
}));
