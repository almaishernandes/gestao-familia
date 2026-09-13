import { supabase } from "@/lib/supabaseClient";

export interface ShoppingList {
  id: string;
  title: string;
  storeType: string | null;
  isArchived: boolean;
  createdAt: string;
}

export interface ShoppingItem {
  id: string;
  listId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string | null;
  estimatedPrice: number | null;
  finalPrice: number | null;
  isChecked: boolean;
  boughtBy: string | null;
}

export async function fetchLists(familyId: string): Promise<ShoppingList[]> {
  const { data, error } = await supabase
    .from("shopping_lists")
    .select("id, title, store_type, is_archived, created_at")
    .eq("family_id", familyId)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    storeType: r.store_type,
    isArchived: r.is_archived,
    createdAt: r.created_at,
  }));
}

export async function createList(familyId: string, userId: string, title: string, storeType: string) {
  const { data, error } = await supabase
    .from("shopping_lists")
    .insert({ family_id: familyId, title, store_type: storeType, created_by: userId })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function fetchItems(listId: string): Promise<ShoppingItem[]> {
  const { data, error } = await supabase
    .from("shopping_items")
    .select("id, list_id, name, category, quantity, unit, estimated_price, final_price, is_checked, bought_by")
    .eq("list_id", listId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    listId: r.list_id,
    name: r.name,
    category: r.category,
    quantity: r.quantity,
    unit: r.unit,
    estimatedPrice: r.estimated_price,
    finalPrice: r.final_price,
    isChecked: r.is_checked,
    boughtBy: r.bought_by,
  }));
}

export async function addItem(listId: string, name: string, category: string, quantity: number) {
  const { error } = await supabase
    .from("shopping_items")
    .insert({ list_id: listId, name, category, quantity });
  if (error) throw error;
}

export async function toggleItem(itemId: string, isChecked: boolean, userId: string) {
  const { error } = await supabase
    .from("shopping_items")
    .update({
      is_checked: isChecked,
      bought_by: isChecked ? userId : null,
      bought_at: isChecked ? new Date().toISOString() : null,
    })
    .eq("id", itemId);
  if (error) throw error;
}

export async function deleteItem(itemId: string) {
  const { error } = await supabase.from("shopping_items").delete().eq("id", itemId);
  if (error) throw error;
}

const CATEGORY_LABEL: Record<string, string> = {
  alimentos: "Alimentos",
  higiene: "Higiene",
  medicamentos: "Medicamentos",
  eletronicos: "Eletrônicos",
  limpeza: "Limpeza",
  outros: "Outros",
};

export function formatListForWhatsApp(listTitle: string, items: ShoppingItem[]): string {
  const lines = [`🛒 *${listTitle}*`, ""];
  const byCategory: Record<string, ShoppingItem[]> = {};
  for (const item of items) {
    byCategory[item.category] ??= [];
    byCategory[item.category].push(item);
  }
  for (const [cat, catItems] of Object.entries(byCategory)) {
    lines.push(`*${CATEGORY_LABEL[cat] ?? cat}*`);
    for (const item of catItems) {
      const check = item.isChecked ? "✅" : "▫️";
      const qty = item.quantity > 1 ? ` (${item.quantity}${item.unit ? " " + item.unit : ""})` : "";
      lines.push(`${check} ${item.name}${qty}`);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}

export function buildWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
