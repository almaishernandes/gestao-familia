import { supabase } from "@/lib/supabaseClient";
import { startOfWeek, addDays, format } from "date-fns";

export interface Recipe {
  id: string;
  name: string;
  calories: number | null;
}

export interface MealPlanEntry {
  id: string;
  dayOfWeek: number;
  slot: "cafe" | "almoco" | "lanche" | "jantar";
  recipeId: string | null;
  recipeName: string | null;
  customLabel: string | null;
}

export const SLOTS: { key: MealPlanEntry["slot"]; label: string }[] = [
  { key: "cafe", label: "Café" },
  { key: "almoco", label: "Almoço" },
  { key: "lanche", label: "Lanche" },
  { key: "jantar", label: "Jantar" },
];

export const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function getCurrentWeekStart(): string {
  return format(startOfWeek(new Date(), { weekStartsOn: 0 }), "yyyy-MM-dd");
}

export function weekDates(weekStart: string): Date[] {
  const start = new Date(weekStart + "T00:00:00");
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export async function fetchRecipes(familyId: string): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from("recipes")
    .select("id, name, calories")
    .eq("family_id", familyId)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createRecipe(familyId: string, name: string, calories: number | null) {
  const { error } = await supabase.from("recipes").insert({ family_id: familyId, name, calories });
  if (error) throw error;
}

export async function fetchMealPlan(familyId: string, weekStart: string): Promise<MealPlanEntry[]> {
  const { data, error } = await supabase
    .from("meal_plans")
    .select("id, day_of_week, slot, recipe_id, custom_label, recipes(name)")
    .eq("family_id", familyId)
    .eq("week_start_date", weekStart);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    dayOfWeek: r.day_of_week,
    slot: r.slot,
    recipeId: r.recipe_id,
    recipeName: r.recipes?.name ?? null,
    customLabel: r.custom_label,
  }));
}

export async function setMealPlanEntry(
  familyId: string,
  weekStart: string,
  dayOfWeek: number,
  slot: MealPlanEntry["slot"],
  recipeId: string | null,
  customLabel: string | null
) {
  const { error } = await supabase.from("meal_plans").upsert(
    {
      family_id: familyId,
      week_start_date: weekStart,
      day_of_week: dayOfWeek,
      slot,
      recipe_id: recipeId,
      custom_label: customLabel,
    },
    { onConflict: "family_id,week_start_date,day_of_week,slot" }
  );
  if (error) throw error;
}

export async function clearMealPlanEntry(entryId: string) {
  const { error } = await supabase.from("meal_plans").delete().eq("id", entryId);
  if (error) throw error;
}

/**
 * Transforma o cardápio da semana numa nova lista de compras: agrega os
 * nomes das receitas planejadas como itens (o ideal seria explodir os
 * ingredientes de recipes.ingredients; aqui simplificamos para 1 item por
 * refeição planejada, servindo como checklist rápido do que precisa comprar).
 */
export async function generateShoppingListFromMealPlan(
  familyId: string,
  userId: string,
  weekStart: string,
  entries: MealPlanEntry[]
) {
  const { data: list, error: listError } = await supabase
    .from("shopping_lists")
    .insert({
      family_id: familyId,
      title: `Compras da semana (${weekStart})`,
      store_type: "supermercado",
      created_by: userId,
    })
    .select("id")
    .single();
  if (listError) throw listError;

  const items = entries
    .filter((e) => e.recipeName || e.customLabel)
    .map((e) => ({
      list_id: list.id,
      name: e.recipeName ?? e.customLabel!,
      category: "alimentos" as const,
    }));

  if (items.length > 0) {
    const { error: itemsError } = await supabase.from("shopping_items").insert(items);
    if (itemsError) throw itemsError;
  }

  return list.id as string;
}
