import {
  LayoutDashboard,
  ShoppingCart,
  Salad,
  HeartPulse,
  Plane,
  Wallet,
  Rss,
  CalendarDays,
  FolderLock,
  type LucideIcon,
} from "lucide-react";
import type { ModuleKey } from "@/types/domain";

export interface NavItem {
  key: ModuleKey;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Início", icon: LayoutDashboard },
  { key: "feed", label: "Mural", icon: Rss },
  { key: "calendario", label: "Agenda", icon: CalendarDays },
  { key: "compras", label: "Compras", icon: ShoppingCart },
  { key: "nutricao", label: "Cardápio", icon: Salad },
  { key: "saude", label: "Saúde", icon: HeartPulse },
  { key: "viagens", label: "Viagens", icon: Plane },
  { key: "financas", label: "Finanças", icon: Wallet },
  { key: "documentos", label: "Documentos", icon: FolderLock },
];

// Itens priorizados na barra inferior mobile (máx. 5)
export const MOBILE_TAB_KEYS: ModuleKey[] = ["dashboard", "compras", "nutricao", "saude", "financas"];
