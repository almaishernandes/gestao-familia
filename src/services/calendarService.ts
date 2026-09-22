import { supabase } from "@/lib/supabaseClient";

export type CalendarEventType = "compromisso" | "tarefa" | "lembrete";

export interface CalendarEvent {
  id: string;
  title: string;
  startsAt: string;
  eventType: CalendarEventType;
  assignedTo: string | null;
  isDone: boolean;
  source: string;
}

export async function fetchEvents(familyId: string): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from("calendar_events")
    .select("id, title, starts_at, event_type, assigned_to, is_done, source")
    .eq("family_id", familyId)
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    startsAt: r.starts_at,
    eventType: r.event_type,
    assignedTo: r.assigned_to,
    isDone: r.is_done,
    source: r.source,
  }));
}

export async function createEvent(
  familyId: string,
  userId: string,
  title: string,
  startsAt: string,
  eventType: CalendarEventType,
  assignedTo: string | null
) {
  const { error } = await supabase.from("calendar_events").insert({
    family_id: familyId,
    title,
    starts_at: startsAt,
    event_type: eventType,
    assigned_to: assignedTo,
    source: "manual",
    created_by: userId,
  });
  if (error) throw error;
}

export async function updateEvent(
  id: string,
  title: string,
  startsAt: string,
  eventType: CalendarEventType,
  assignedTo: string | null
) {
  const { error } = await supabase
    .from("calendar_events")
    .update({ title, starts_at: startsAt, event_type: eventType, assigned_to: assignedTo })
    .eq("id", id);
  if (error) throw error;
}

export async function toggleDone(id: string, isDone: boolean) {
  const { error } = await supabase.from("calendar_events").update({ is_done: isDone }).eq("id", id);
  if (error) throw error;
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from("calendar_events").delete().eq("id", id);
  if (error) throw error;
}
