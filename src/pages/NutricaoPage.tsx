import { Fragment, useEffect, useState, useCallback } from "react";
import { ShoppingCart, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { TextField, PrimaryButton } from "@/components/ui/Field";
import { useAppStore } from "@/stores/useAppStore";
import { toastSuccess, toastError } from "@/stores/useToastStore";
import * as nutritionService from "@/services/nutritionService";
import type { Recipe, MealPlanEntry } from "@/services/nutritionService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function NewRecipeModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const familyId = useAppStore((s) => s.familyId);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!familyId) return;
    setLoading(true);
    try {
      await nutritionService.createRecipe(familyId, name, calories ? Number(calories) : null);
      toastSuccess("Receita salva!");
      setName("");
      setCalories("");
      onCreated();
      onClose();
    } catch {
      toastError("Não foi possível salvar a receita.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova receita">
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField label="Nome" required value={name} onChange={(e) => setName(e.target.value)} />
        <TextField
          label="Calorias (opcional)"
          type="number"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
        />
        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar receita"}
        </PrimaryButton>
      </form>
    </Modal>
  );
}

export function NutricaoPage() {
  const { familyId, currentUserId } = useAppStore();
  const [weekStart] = useState(nutritionService.getCurrentWeekStart());
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [entries, setEntries] = useState<MealPlanEntry[]>([]);
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const reload = useCallback(async () => {
    if (!familyId) return;
    const [r, e] = await Promise.all([
      nutritionService.fetchRecipes(familyId),
      nutritionService.fetchMealPlan(familyId, weekStart),
    ]);
    setRecipes(r);
    setEntries(e);
  }, [familyId, weekStart]);

  useEffect(() => {
    reload();
  }, [reload]);

  function entryFor(day: number, slot: MealPlanEntry["slot"]) {
    return entries.find((e) => e.dayOfWeek === day && e.slot === slot);
  }

  async function handleSelect(day: number, slot: MealPlanEntry["slot"], recipeId: string) {
    if (!familyId) return;
    await nutritionService.setMealPlanEntry(familyId, weekStart, day, slot, recipeId || null, null);
    reload();
  }

  async function handleGenerateList() {
    if (!familyId || !currentUserId) return;
    setGenerating(true);
    try {
      await nutritionService.generateShoppingListFromMealPlan(familyId, currentUserId, weekStart, entries);
      toastSuccess("Lista de compras gerada! Confira no Hub de Compras.");
    } catch {
      toastError("Não foi possível gerar a lista. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  }

  const dates = nutritionService.weekDates(weekStart);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24 md:pb-8">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">Cardápio Semanal</h1>
          <p className="text-sm text-slate-400 mt-1">
            Semana de {format(dates[0], "d MMM", { locale: ptBR })} a {format(dates[6], "d MMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setRecipeModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <Plus className="h-4 w-4" />
            Receita
          </button>
          <button
            onClick={handleGenerateList}
            disabled={generating}
            className="inline-flex items-center gap-1.5 rounded-xl bg-sage-500 hover:bg-sage-600 text-white text-sm font-medium px-3 py-2 disabled:opacity-60"
          >
            <ShoppingCart className="h-4 w-4" />
            {generating ? "Gerando..." : "Gerar lista de compras"}
          </button>
        </div>
      </div>

      <Card className="p-4 overflow-x-auto">
        <div className="min-w-[720px] grid grid-cols-8 gap-2">
          <div />
          {dates.map((d, i) => (
            <div key={i} className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 pb-2">
              {nutritionService.WEEKDAY_LABELS[i]}
              <div className="text-[10px] text-slate-400">{format(d, "d/M")}</div>
            </div>
          ))}

          {nutritionService.SLOTS.map((slot) => (
            <Fragment key={slot.key}>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center">
                {slot.label}
              </div>
              {dates.map((_, day) => {
                const entry = entryFor(day, slot.key);
                return (
                  <select
                    key={`${slot.key}-${day}`}
                    value={entry?.recipeId ?? ""}
                    onChange={(e) => handleSelect(day, slot.key, e.target.value)}
                    className="text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-1.5 py-2 outline-none focus:ring-2 focus:ring-sage-400"
                  >
                    <option value="">—</option>
                    {recipes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                );
              })}
            </Fragment>
          ))}
        </div>
      </Card>

      {recipes.length === 0 && (
        <p className="text-sm text-slate-400 text-center mt-6">
          Cadastre receitas para começar a montar o cardápio.
        </p>
      )}

      <NewRecipeModal open={recipeModalOpen} onClose={() => setRecipeModalOpen(false)} onCreated={reload} />
    </div>
  );
}
