import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, ChevronLeft, ChevronRight, CalendarClock, ListChecks, Bell, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { TextField, SelectField, PrimaryButton } from "@/components/ui/Field";
import { EmptyState } from "@/components/shared/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { useAppStore } from "@/stores/useAppStore";
import { toastSuccess, toastError } from "@/stores/useToastStore";
import * as calendarService from "@/services/calendarService";
import type { CalendarEvent, CalendarEventType } from "@/services/calendarService";
import { cn } from "@/lib/utils";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  format,
} from "date-fns";
import { ptBR } from "date-fns/locale";

const TYPE_ICON: Record<CalendarEventType, typeof CalendarClock> = {
  compromisso: CalendarClock,
  tarefa: ListChecks,
  lembrete: Bell,
};

const TYPE_LABEL: Record<CalendarEventType, string> = {
  compromisso: "Compromisso",
  tarefa: "Tarefa",
  lembrete: "Lembrete",
};

const TYPE_COLOR: Record<CalendarEventType, string> = {
  compromisso: "text-sky-500 bg-sky-50 dark:bg-sky-600/20",
  tarefa: "text-amber-500 bg-amber-50 dark:bg-amber-600/20",
  lembrete: "text-violet-500 bg-violet-50 dark:bg-violet-600/20",
};

const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

function NewEventModal({ open, onClose, onCreated, defaultDate }: { open: boolean; onClose: () => void; onCreated: () => void; defaultDate: Date }) {
  const { familyId, currentUserId, members } = useAppStore();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(format(defaultDate, "yyyy-MM-dd"));
  const [time, setTime] = useState("09:00");
  const [eventType, setEventType] = useState<CalendarEventType>("compromisso");
  const [assignedTo, setAssignedTo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDate(format(defaultDate, "yyyy-MM-dd"));
  }, [defaultDate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!familyId || !currentUserId || !title || !date) return;
    setLoading(true);
    try {
      await calendarService.createEvent(
        familyId,
        currentUserId,
        title,
        new Date(`${date}T${time}`).toISOString(),
        eventType,
        assignedTo || null
      );
      toastSuccess("Adicionado à agenda!");
      setTitle("");
      onCreated();
      onClose();
    } catch {
      toastError("Não foi possível criar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo na agenda">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-700">
          {(Object.keys(TYPE_LABEL) as CalendarEventType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setEventType(t)}
              className={cn(
                "rounded-lg py-2 text-xs font-medium transition-colors",
                eventType === t ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400"
              )}
            >
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>
        <TextField label="Título" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Data" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          <TextField label="Hora" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <SelectField label="Responsável" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
          <option value="">Toda a família</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.fullName}
            </option>
          ))}
        </SelectField>
        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Adicionar"}
        </PrimaryButton>
      </form>
    </Modal>
  );
}

export function CalendarioPage() {
  const { familyId, members } = useAppStore();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [monthCursor, setMonthCursor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);

  const reload = useCallback(async () => {
    if (!familyId) return;
    setEvents(await calendarService.fetchEvents(familyId));
  }, [familyId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const filteredEvents = useMemo(
    () => events.filter((e) => memberFilter === "all" || e.assignedTo === memberFilter),
    [events, memberFilter]
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of filteredEvents) {
      const key = format(new Date(e.startsAt), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [filteredEvents]);

  const gridDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthCursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(monthCursor), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [monthCursor]);

  const listEvents = useMemo(() => {
    const base = selectedDate
      ? filteredEvents.filter((e) => isSameDay(new Date(e.startsAt), selectedDate))
      : filteredEvents.filter((e) => new Date(e.startsAt) >= new Date(new Date().setHours(0, 0, 0, 0)));
    return [...base].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }, [filteredEvents, selectedDate]);

  async function handleToggleDone(id: string, done: boolean) {
    try {
      await calendarService.toggleDone(id, done);
      reload();
    } catch {
      toastError("Não foi possível atualizar.");
    }
  }

  function memberName(id: string | null) {
    if (!id) return "Toda a família";
    return members.find((m) => m.id === id)?.fullName ?? "Membro";
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">Agenda da Família</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-sage-500 hover:bg-sage-600 text-white text-sm font-medium px-4 py-2.5"
        >
          <Plus className="h-4 w-4" />
          Novo
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-[340px_1fr] lg:gap-6 lg:items-start">
        <div className="lg:sticky lg:top-6 mb-6 lg:mb-0 mx-auto w-full max-w-sm lg:max-w-none">
          <Card className="p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setMonthCursor((d) => subMonths(d, 1))} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium capitalize text-slate-900 dark:text-white">
                {format(monthCursor, "MMMM 'de' yyyy", { locale: ptBR })}
              </span>
              <button onClick={() => setMonthCursor((d) => addMonths(d, 1))} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAY_LABELS.map((d, i) => (
                <div key={i} className="text-center text-[11px] font-medium text-slate-400 py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {gridDays.map((day, i) => {
                const key = format(day, "yyyy-MM-dd");
                const dayEvents = eventsByDay.get(key) ?? [];
                const inMonth = isSameMonth(day, monthCursor);
                const selected = selectedDate && isSameDay(day, selectedDate);
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(selected ? null : day)}
                    className={cn(
                      "aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 text-xs relative transition-colors",
                      !inMonth && "text-slate-300 dark:text-slate-600",
                      inMonth && !selected && "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50",
                      selected && "bg-sage-500 text-white",
                      isToday(day) && !selected && "font-semibold text-sage-600"
                    )}
                  >
                    {format(day, "d")}
                    {dayEvents.length > 0 && (
                      <span className={cn("h-1 w-1 rounded-full", selected ? "bg-white" : "bg-sage-500")} />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
            <button
              onClick={() => setMemberFilter("all")}
              className={cn(
                "shrink-0 text-xs font-medium rounded-full px-3 py-1.5",
                memberFilter === "all" ? "bg-sage-500 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300"
              )}
            >
              Todos
            </button>
            {members.map((m) => (
              <button
                key={m.id}
                onClick={() => setMemberFilter(m.id)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 text-xs font-medium rounded-full pl-1 pr-3 py-1",
                  memberFilter === m.id ? "bg-sage-500 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300"
                )}
              >
                <Avatar name={m.fullName} src={m.avatarUrl} size="sm" />
                {m.fullName}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: ptBR }) : "Próximos compromissos"}
            </h2>
            {selectedDate && (
              <button onClick={() => setSelectedDate(null)} className="text-xs text-sage-600 font-medium">
                Ver todos
              </button>
            )}
          </div>

          <Card className="p-2">
            {listEvents.map((event) => {
          const Icon = TYPE_ICON[event.eventType];
          const isTask = event.eventType !== "compromisso";
          return (
            <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/40 group">
              {isTask ? (
                <input
                  type="checkbox"
                  checked={event.isDone}
                  onChange={(e) => handleToggleDone(event.id, e.target.checked)}
                  className="h-5 w-5 rounded accent-sage-500 shrink-0"
                />
              ) : (
                <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", TYPE_COLOR[event.eventType])}>
                  <Icon className="h-4 w-4" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium text-slate-800 dark:text-slate-100", event.isDone && "line-through text-slate-400")}>
                  {event.title}
                </p>
                <p className="text-xs text-slate-400">
                  {format(new Date(event.startsAt), "d MMM 'às' HH:mm", { locale: ptBR })} · {memberName(event.assignedTo)}
                </p>
              </div>
              <span className={cn("text-[10px] rounded-full px-2 py-0.5 shrink-0 hidden sm:inline", TYPE_COLOR[event.eventType])}>
                {TYPE_LABEL[event.eventType]}
              </span>
            </div>
          );
        })}
            {listEvents.length === 0 && (
              <EmptyState icon={CalendarDays} title="Nada por aqui" description="Adicione um compromisso, tarefa ou lembrete." />
            )}
          </Card>
        </div>
      </div>

      <NewEventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={reload}
        defaultDate={selectedDate ?? new Date()}
      />
    </div>
  );
}
