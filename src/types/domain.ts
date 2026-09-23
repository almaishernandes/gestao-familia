export type FamilyRole = "owner" | "adult" | "dependent";

export interface Profile {
  id: string;
  fullName: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface FamilyMember extends Profile {
  role: FamilyRole;
  relationship: string | null;
  canViewFinances: boolean;
}

export type ModuleKey =
  | "dashboard"
  | "compras"
  | "nutricao"
  | "saude"
  | "viagens"
  | "financas"
  | "feed"
  | "calendario"
  | "documentos";

export interface FeedPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  type: "foto" | "aviso" | "recado" | "conquista";
  content?: string;
  mediaUrl?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  entityType: string;
  entityId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface ShoppingListSummary {
  id: string;
  title: string;
  storeType?: string;
  totalItems: number;
  checkedItems: number;
}

export interface CalendarEventSummary {
  id: string;
  title: string;
  startsAt: string;
  source: "manual" | "aniversario" | "saude" | "viagem" | "financeiro";
}

export interface BudgetStatus {
  category: string;
  planned: number;
  spent: number;
}
