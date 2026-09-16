import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Plus, PiggyBank, Plane, Receipt } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { TextField, SelectField, PrimaryButton } from "@/components/ui/Field";
import { CommentsDrawer } from "@/components/shared/CommentsDrawer";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAppStore } from "@/stores/useAppStore";
import { toastSuccess, toastError } from "@/stores/useToastStore";
import * as tripsService from "@/services/tripsService";
import type { Trip, TripExpense } from "@/services/tripsService";

function NewTripModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { familyId, currentUserId } = useAppStore();
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!familyId || !currentUserId) return;
    setLoading(true);
    try {
      await tripsService.createTrip(familyId, currentUserId, title, destination, goal ? Number(goal) : 0);
      toastSuccess("Viagem criada!");
      setTitle("");
      setDestination("");
      setGoal("");
      onCreated();
      onClose();
    } catch {
      toastError("Não foi possível criar a viagem.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova viagem">
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField label="Título" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <TextField label="Destino" value={destination} onChange={(e) => setDestination(e.target.value)} />
        <TextField
          label="Meta de economia (R$)"
          type="number"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        />
        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "Criando..." : "Criar viagem"}
        </PrimaryButton>
      </form>
    </Modal>
  );
}

function TripDetail({ trip, onBack, onChanged }: { trip: Trip; onBack: () => void; onChanged: () => void }) {
  const { currentUserId, members } = useAppStore();
  const [expenses, setExpenses] = useState<TripExpense[]>([]);
  const [contribAmount, setContribAmount] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expensePaidBy, setExpensePaidBy] = useState(members[0]?.id ?? "");

  const load = useCallback(async () => {
    setExpenses(await tripsService.fetchTripExpenses(trip.id));
  }, [trip.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleContribute(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUserId || !contribAmount) return;
    try {
      await tripsService.addSavingsContribution(trip.id, currentUserId, Number(contribAmount));
      toastSuccess("Valor guardado no cofrinho!");
      setContribAmount("");
      onChanged();
    } catch {
      toastError("Não foi possível guardar o valor.");
    }
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!expenseDesc || !expenseAmount || !expensePaidBy) return;
    try {
      await tripsService.addTripExpense(trip.id, expenseDesc, Number(expenseAmount), expensePaidBy);
      setExpenseDesc("");
      setExpenseAmount("");
      load();
    } catch {
      toastError("Não foi possível registrar o gasto.");
    }
  }

  const progress = trip.savingsGoal > 0 ? Math.min((trip.savedTotal / trip.savingsGoal) * 100, 100) : 0;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  function memberName(id: string | null) {
    return members.find((m) => m.id === id)?.fullName ?? "—";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-slate-400 hover:text-sage-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="font-semibold text-lg text-slate-900 dark:text-white flex-1">{trip.title}</h2>
        <CommentsDrawer entityType="trip" entityId={trip.id} />
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <PiggyBank className="h-5 w-5 text-sage-500" />
          <h3 className="font-medium text-slate-900 dark:text-white">Cofrinho da viagem</h3>
        </div>
        <p className="text-sm text-slate-500 mb-2">
          R$ {trip.savedTotal.toFixed(2)} de R$ {trip.savingsGoal.toFixed(2)}
        </p>
        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden mb-4">
          <div className="h-full bg-sage-500 rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <form onSubmit={handleContribute} className="flex gap-2">
          <input
            type="number"
            placeholder="Valor a guardar (R$)"
            value={contribAmount}
            onChange={(e) => setContribAmount(e.target.value)}
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sage-400"
          />
          <button type="submit" className="rounded-xl bg-sage-500 hover:bg-sage-600 text-white px-4 text-sm font-medium">
            Guardar
          </button>
        </form>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-slate-900 dark:text-white">Gastos da viagem</h3>
          <span className="text-sm text-slate-400">Total: R$ {totalExpenses.toFixed(2)}</span>
        </div>
        <form onSubmit={handleAddExpense} className="flex flex-wrap gap-2 mb-4">
          <input
            placeholder="Descrição"
            value={expenseDesc}
            onChange={(e) => setExpenseDesc(e.target.value)}
            className="flex-1 min-w-[140px] rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-sm outline-none"
          />
          <input
            type="number"
            placeholder="R$"
            value={expenseAmount}
            onChange={(e) => setExpenseAmount(e.target.value)}
            className="w-24 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-sm outline-none"
          />
          <select
            value={expensePaidBy}
            onChange={(e) => setExpensePaidBy(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-2 py-2 text-sm outline-none"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-xl bg-sage-500 hover:bg-sage-600 text-white px-4 text-sm font-medium">
            <Plus className="h-4 w-4" />
          </button>
        </form>
        <div className="space-y-1.5">
          {expenses.map((e) => (
            <div key={e.id} className="flex items-center justify-between text-sm py-1.5">
              <span className="text-slate-700 dark:text-slate-200">{e.description}</span>
              <span className="text-slate-400">
                R$ {e.amount.toFixed(2)} · {memberName(e.paidBy)}
              </span>
            </div>
          ))}
          {expenses.length === 0 && <EmptyState icon={Receipt} title="Nenhum gasto registrado" />}
        </div>
      </Card>
    </div>
  );
}

export function ViagensPage() {
  const familyId = useAppStore((s) => s.familyId);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selected, setSelected] = useState<Trip | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const reload = useCallback(async () => {
    if (!familyId) return;
    const data = await tripsService.fetchTrips(familyId);
    setTrips(data);
    if (selected) {
      setSelected(data.find((t) => t.id === selected.id) ?? null);
    }
  }, [familyId, selected]);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId]);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24 md:pb-8">
      {selected ? (
        <TripDetail trip={selected} onBack={() => setSelected(null)} onChanged={reload} />
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">Viagens & Lazer</h1>
              <p className="text-sm text-slate-400 mt-1">Planejamento, cofrinho e gastos compartilhados.</p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sage-500 hover:bg-sage-600 text-white text-sm font-medium px-4 py-2.5"
            >
              <Plus className="h-4 w-4" />
              Nova viagem
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {trips.map((trip) => {
              const progress = trip.savingsGoal > 0 ? Math.min((trip.savedTotal / trip.savingsGoal) * 100, 100) : 0;
              return (
                <Card
                  key={trip.id}
                  onClick={() => setSelected(trip)}
                  className="p-5 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <h3 className="font-medium text-slate-900 dark:text-white">{trip.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{trip.destination}</p>
                  {trip.savingsGoal > 0 && (
                    <div className="mt-3">
                      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                        <div className="h-full bg-sage-500 rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        R$ {trip.savedTotal.toFixed(0)} / R$ {trip.savingsGoal.toFixed(0)}
                      </p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
          {trips.length === 0 && (
            <EmptyState
              icon={Plane}
              title="Nenhuma viagem planejada ainda"
              description="Crie a primeira viagem e comece a organizar o roteiro e o cofrinho."
            />
          )}
        </>
      )}

      <NewTripModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={reload} />
    </div>
  );
}
