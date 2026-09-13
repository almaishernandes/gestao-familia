import { supabase } from "@/lib/supabaseClient";

export interface CalendarEvent {
  id: string;
  title: string;
  startsAt: string;
  source: string;
}

export async function fetchUpcomingEvents(familyId: string): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from("calendar_events")
    .select("id, title, starts_at, source")
    .eq("family_id", familyId)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({ id: r.id, title: r.title, startsAt: r.starts_at, source: r.source }));
}

export async function createEvent(familyId: string, userId: string, title: string, startsAt: string) {
  const { error } = await supabase.from("calendar_events").insert({
    family_id: familyId,
    title,
    starts_at: startsAt,
    source: "manual",
    created_by: userId,
  });
  if (error) throw error;
}
