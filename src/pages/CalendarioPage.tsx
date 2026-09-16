import { useEffect, useState, useCallback } from "react";
import { Plus, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { TextField, PrimaryButton } from "@/components/ui/Field";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAppStore } from "@/stores/useAppStore";
import { toastSuccess, toastError } from "@/stores/useToastStore";
import * as calendarService from "@/services/calendarService";
import type { CalendarEvent } from "@/services/calendarService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const SOURCE_LABEL: Record<string, string> = {
  manual: "Evento",
  aniversario: "Aniversário",
  saude: "Saúde",
  viagem: "Viagem",
  financeiro: "Financeiro",
};

function NewEventModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { familyId, currentUserId } = useAppStore();
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!familyId || !currentUserId || !startsAt) return;
    setLoading(true);
    try {
      await calendarService.createEvent(familyId, currentUserId, title, new Date(startsAt).toISOString());
      toastSuccess("Evento adicionado à agenda!");
      setTitle("");
      setStartsAt("");
      onCreated();
      onClose();
    } catch {
      toastError("Não foi possível criar o evento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo evento">
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField label="Título" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <TextField
          label="Data e hora"
          type="datetime-local"
          required
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
        />
        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Adicionar ao calendário"}
        </PrimaryButton>
      </form>
    </Modal>
  );
}

export function CalendarioPage() {
  const familyId = useAppStore((s) => s.familyId);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const reload = useCallback(async () => {
    if (!familyId) return;
    setEvents(await calendarService.fetchUpcomingEvents(familyId));
  }, [familyId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">Calendário Unificado</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-sage-500 hover:bg-sage-600 text-white text-sm font-medium px-4 py-2.5"
        >
          <Plus className="h-4 w-4" />
          Evento
        </button>
      </div>

      <Card className="p-2">
        {events.map((ev) => (
          <div key={ev.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/40">
            <div className="h-9 w-9 rounded-xl bg-sage-50 dark:bg-sage-600/20 flex items-center justify-center">
              <CalendarDays className="h-4 w-4 text-sage-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{ev.title}</p>
              <p className="text-xs text-slate-400">
                {format(new Date(ev.startsAt), "d MMM 'às' HH:mm", { locale: ptBR })} · {SOURCE_LABEL[ev.source]}
              </p>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <EmptyState icon={CalendarDays} title="Nenhum evento futuro agendado" />
        )}
      </Card>

      <NewEventModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={reload} />
    </div>
  );
}
