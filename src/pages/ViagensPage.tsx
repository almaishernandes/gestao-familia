import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Plus, PiggyBank, Plane, Receipt, MapPinned, Trash2, Wallet2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { TextField, SelectField, PrimaryButton } from "@/components/ui/Field";
import { CommentsDrawer } from "@/components/shared/CommentsDrawer";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAppStore } from "@/stores/useAppStore";
import { toastSuccess, toastError } from "@/stores/useToastStore";
import * as tripsService from "@/services/tripsService";
import type {
  Trip,
  TripExpense,
  TripItineraryItem,
  FundingSource,
  TripCategory,
  ExpenseCategory,
  FundingSourceType,
} from "@/services/tripsService";
import { cn } from "@/lib/utils";

const CATEGORY_TABS: { key: TripCategory; label: string }[] = [
  { key: "viagem", label: "Viagens" },
  { key: "lazer", label: "Lazer" },
  { key: "excursao", label: "Excursões" },
];

const CATEGORY_EMPTY_COPY: Record<TripCategory, { title: string; description: string }> = {
  viagem: { title: "Nenhuma viagem planejada ainda", description: "Crie a primeira viagem e comece a organizar o roteiro e o cofrinho." },
  lazer: { title: "Nenhum passeio de lazer ainda", description: "Cinema, parque, praia de um dia — registre e organize os gastos." },
  excursao: { title: "Nenhuma excursão ainda", description: "Saídas em grupo, da igreja, escola ou comunidade." },
};

const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  transporte: "Transporte",
  hospedagem: "Hospedagem",
  alimentacao: "Alimentação",
  ingressos: "Ingressos",
  saude: "Saúde",
  compras: "Compras",
  outros: "Outros",
};

const FUNDING_TYPE_LABEL: Record<FundingSourceType, string> = {
  cofrinho_familia: "Cofrinho da família",
  patrocinio: "Patrocínio",
  venda: "Venda (rifa, itens...)",
  ajuda_terceiros: "Ajuda de terceiros",
  verba_instituicao: "Verba da instituição",
  outro: "Outro",
};

const ITINERARY_TYPES = [
  { value: "transporte", label: "Transporte" },
  { value: "hotel", label: "Hospedagem" },
  { value: "turismo", label: "Passeio/Turismo" },
  { value: "religioso", label: "Religioso" },
  { value: "restaurante", label: "Restaurante" },
  { value: "outros", label: "Outros" },
];

function NewTripModal({
  open,
  onClose,
  onCreated,
  category,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  category: TripCategory;
}) {
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
      await tripsService.createTrip(familyId, currentUserId, category, title, destination, goal ? Number(goal) : 0);
      toastSuccess("Criado com sucesso!");
      setTitle("");
      setDestination("");
      setGoal("");
      onCreated();
      onClose();
    } catch {
      toastError("Não foi possível criar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Novo em ${CATEGORY_TABS.find((c) => c.key === category)?.label}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField label="Título" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <TextField label="Destino / Local" value={destination} onChange={(e) => setDestination(e.target.value)} />
        <TextField
          label="Meta de economia (R$)"
          type="number"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        />
        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "Criando..." : "Criar"}
        </PrimaryButton>
      </form>
    </Modal>
  );
}

function ItinerarySection({ tripId }: { tripId: string }) {
  const [items, setItems] = useState<TripItineraryItem[]>([]);
  const [dayDate, setDayDate] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("turismo");
  const [location, setLocation] = useState("");

  const load = useCallback(async () => {
    setItems(await tripsService.fetchItinerary(tripId));
  }, [tripId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await tripsService.addItineraryItem(tripId, dayDate, timeOfDay, title.trim(), type, location.trim());
      setTitle("");
      setLocation("");
      load();
    } catch {
      toastError("Não foi possível adicionar ao roteiro.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await tripsService.deleteItineraryItem(id);
      load();
    } catch {
      toastError("Não foi possível remover.");
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <MapPinned className="h-5 w-5 text-sage-500" />
        <h3 className="font-medium text-slate-900 dark:text-white">Roteiro</h3>
      </div>

      <form onSubmit={handleAdd} className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        <input
          type="date"
          value={dayDate}
          onChange={(e) => setDayDate(e.target.value)}
          className="col-span-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-2 py-2 text-xs outline-none"
        />
        <input
          type="time"
          value={timeOfDay}
          onChange={(e) => setTimeOfDay(e.target.value)}
          className="col-span-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-2 py-2 text-xs outline-none"
        />
        <input
          placeholder="O que vai acontecer"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="col-span-2 sm:col-span-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-sm outline-none"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="col-span-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-2 py-2 text-xs outline-none"
        >
          {ITINERARY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <div className="col-span-2 sm:col-span-1 flex gap-2">
          <input
            placeholder="Local"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="flex-1 min-w-0 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-sm outline-none"
          />
          <button type="submit" className="rounded-xl bg-sage-500 hover:bg-sage-600 text-white px-3 shrink-0">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </form>

      <div className="space-y-1.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/40 group"
          >
            <div className="text-xs text-slate-400 w-20 shrink-0">
              {item.dayDate ? new Date(item.dayDate + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "—"}
              {item.timeOfDay && ` · ${item.timeOfDay.slice(0, 5)}`}
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-700 dark:text-slate-200">{item.title}</p>
              {item.location && <p className="text-xs text-slate-400">{item.location}</p>}
            </div>
            <span className="text-xs text-slate-400 capitalize hidden sm:inline">{item.type}</span>
            <button
              onClick={() => handleDelete(item.id)}
              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-terracotta-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && <EmptyState icon={MapPinned} title="Roteiro vazio" description="Adicione o primeiro evento do percurso." />}
      </div>
    </Card>
  );
}

function FundingSection({ tripId, onChanged }: { tripId: string; onChanged: () => void }) {
  const [sources, setSources] = useState<FundingSource[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState<FundingSourceType>("cofrinho_familia");
  const [planned, setPlanned] = useState("");

  const load = useCallback(async () => {
    setSources(await tripsService.fetchFundingSources(tripId));
  }, [tripId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !planned) return;
    try {
      await tripsService.addFundingSource(tripId, type, name.trim(), Number(planned));
      setName("");
      setPlanned("");
      load();
    } catch {
      toastError("Não foi possível adicionar a fonte de recurso.");
    }
  }

  async function handleReceived(id: string, current: number, delta: number) {
    try {
      await tripsService.updateFundingReceived(id, Math.max(0, current + delta));
      load();
      onChanged();
    } catch {
      toastError("Não foi possível atualizar.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await tripsService.deleteFundingSource(id);
      load();
    } catch {
      toastError("Não foi possível remover.");
    }
  }

  const totalPlanned = sources.reduce((s, f) => s + f.plannedAmount, 0);
  const totalReceived = sources.reduce((s, f) => s + f.receivedAmount, 0);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wallet2 className="h-5 w-5 text-amber-500" />
          <h3 className="font-medium text-slate-900 dark:text-white">Fontes de recursos</h3>
        </div>
        <span className="text-xs text-slate-400">
          R$ {totalReceived.toFixed(2)} / R$ {totalPlanned.toFixed(2)}
        </span>
      </div>

      <form onSubmit={handleAdd} className="flex flex-wrap gap-2 mb-4">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as FundingSourceType)}
          className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-2 py-2 text-xs outline-none"
        >
          {Object.entries(FUNDING_TYPE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          placeholder="Nome (ex: Rifa da comunidade)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 min-w-[140px] rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-sm outline-none"
        />
        <input
          type="number"
          placeholder="Meta R$"
          value={planned}
          onChange={(e) => setPlanned(e.target.value)}
          className="w-24 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-sm outline-none"
        />
        <button type="submit" className="rounded-xl bg-sage-500 hover:bg-sage-600 text-white px-4 text-sm font-medium">
          <Plus className="h-4 w-4" />
        </button>
      </form>

      <div className="space-y-3">
        {sources.map((f) => {
          const progress = f.plannedAmount > 0 ? Math.min((f.receivedAmount / f.plannedAmount) * 100, 100) : 0;
          return (
            <div key={f.id} className="group">
              <div className="flex items-center justify-between text-sm mb-1">
                <div>
                  <span className="text-slate-700 dark:text-slate-200">{f.name}</span>
                  <span className="text-slate-400 text-xs ml-2">{FUNDING_TYPE_LABEL[f.type]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    R$ {f.receivedAmount.toFixed(2)} / R$ {f.plannedAmount.toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleReceived(f.id, f.receivedAmount, 50)}
                    className="text-xs rounded-full bg-sage-50 dark:bg-sage-600/20 text-sage-600 px-2 py-0.5 hover:bg-sage-100"
                  >
                    +R$50
                  </button>
                  <button
                    onClick={() => handleDelete(f.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-terracotta-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${progress}%` }} />
              </div>
            </div>
          );
        })}
        {sources.length === 0 && (
          <EmptyState
            icon={Wallet2}
            title="Nenhuma fonte de recurso cadastrada"
            description="Cofrinho, patrocínio, venda de itens... de onde vai sair o dinheiro?"
          />
        )}
      </div>
    </Card>
  );
}

function TripDetail({ trip, onBack, onChanged }: { trip: Trip; onBack: () => void; onChanged: () => void }) {
  const { currentUserId, members } = useAppStore();
  const [expenses, setExpenses] = useState<TripExpense[]>([]);
  const [contribAmount, setContribAmount] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>("outros");
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
      await tripsService.addTripExpense(trip.id, expenseCategory, expenseDesc, Number(expenseAmount), expensePaidBy);
      setExpenseDesc("");
      setExpenseAmount("");
      load();
    } catch {
      toastError("Não foi possível registrar o gasto.");
    }
  }

  const progress = trip.savingsGoal > 0 ? Math.min((trip.savedTotal / trip.savingsGoal) * 100, 100) : 0;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const expensesByCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});

  function memberName(id: string | null) {
    return members.find((m) => m.id === id)?.fullName ?? "—";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-slate-400 hover:text-sage-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white flex-1">{trip.title}</h2>
        <CommentsDrawer entityType="trip" entityId={trip.id} />
      </div>

      <ItinerarySection tripId={trip.id} />

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <PiggyBank className="h-5 w-5 text-sage-500" />
          <h3 className="font-medium text-slate-900 dark:text-white">Cofrinho da família</h3>
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

      <FundingSection tripId={trip.id} onChanged={onChanged} />

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-slate-900 dark:text-white">Gastos</h3>
          <span className="text-sm text-slate-400">Total: R$ {totalExpenses.toFixed(2)}</span>
        </div>

        {Object.keys(expensesByCategory).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(expensesByCategory).map(([cat, amount]) => (
              <span
                key={cat}
                className="text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1"
              >
                {EXPENSE_CATEGORY_LABEL[cat as ExpenseCategory]}: R$ {amount.toFixed(2)}
              </span>
            ))}
          </div>
        )}

        <form onSubmit={handleAddExpense} className="flex flex-wrap gap-2 mb-4">
          <select
            value={expenseCategory}
            onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
            className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-2 py-2 text-xs outline-none"
          >
            {Object.entries(EXPENSE_CATEGORY_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
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
              <div>
                <span className="text-slate-700 dark:text-slate-200">{e.description}</span>
                <span className="text-xs text-slate-400 ml-2">{EXPENSE_CATEGORY_LABEL[e.category]}</span>
              </div>
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
  const [activeCategory, setActiveCategory] = useState<TripCategory>("viagem");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selected, setSelected] = useState<Trip | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const reload = useCallback(async () => {
    if (!familyId) return;
    const data = await tripsService.fetchTrips(familyId, activeCategory);
    setTrips(data);
    setSelected((prev) => (prev ? data.find((t) => t.id === prev.id) ?? null : null));
  }, [familyId, activeCategory]);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId, activeCategory]);

  const emptyCopy = CATEGORY_EMPTY_COPY[activeCategory];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24 md:pb-8">
      {selected ? (
        <TripDetail trip={selected} onBack={() => setSelected(null)} onChanged={reload} />
      ) : (
        <>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">Viagens & Lazer</h1>
              <p className="text-sm text-slate-400 mt-1">Roteiro, gastos e fontes de recursos para cada evento.</p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sage-500 hover:bg-sage-600 text-white text-sm font-medium px-4 py-2.5"
            >
              <Plus className="h-4 w-4" />
              Novo
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-700 mb-6 max-w-sm">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveCategory(tab.key)}
                className={cn(
                  "rounded-lg py-2 text-sm font-medium transition-colors",
                  activeCategory === tab.key
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400"
                )}
              >
                {tab.label}
              </button>
            ))}
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
            <EmptyState icon={activeCategory === "viagem" ? Plane : MapPinned} title={emptyCopy.title} description={emptyCopy.description} />
          )}
        </>
      )}

      <NewTripModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={reload} category={activeCategory} />
    </div>
  );
}
