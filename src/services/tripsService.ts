import { supabase } from "@/lib/supabaseClient";

export type TripCategory = "viagem" | "lazer" | "excursao";

export type ExpenseCategory =
  | "transporte"
  | "hospedagem"
  | "alimentacao"
  | "ingressos"
  | "saude"
  | "compras"
  | "outros";

export type FundingSourceType =
  | "cofrinho_familia"
  | "patrocinio"
  | "venda"
  | "ajuda_terceiros"
  | "verba_instituicao"
  | "outro";

export interface Trip {
  id: string;
  category: TripCategory;
  title: string;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  savingsGoal: number;
  savedTotal: number;
}

export interface TripExpense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paidBy: string | null;
}

export interface TripItineraryItem {
  id: string;
  dayDate: string | null;
  timeOfDay: string | null;
  title: string;
  type: string | null;
  location: string | null;
  notes: string | null;
}

export interface FundingSource {
  id: string;
  type: FundingSourceType;
  name: string;
  plannedAmount: number;
  receivedAmount: number;
  notes: string | null;
}

export async function fetchTrips(familyId: string, category: TripCategory): Promise<Trip[]> {
  const { data, error } = await supabase
    .from("trips")
    .select("id, category, title, destination, start_date, end_date, status, savings_goal")
    .eq("family_id", familyId)
    .eq("category", category)
    .order("start_date", { ascending: true, nullsFirst: false });
  if (error) throw error;

  const trips = data ?? [];
  const results: Trip[] = [];
  for (const t of trips) {
    const { data: contributions } = await supabase
      .from("trip_savings_contributions")
      .select("amount")
      .eq("trip_id", t.id);
    const savedTotal = (contributions ?? []).reduce((sum, c: any) => sum + Number(c.amount), 0);
    results.push({
      id: t.id,
      category: t.category,
      title: t.title,
      destination: t.destination,
      startDate: t.start_date,
      endDate: t.end_date,
      status: t.status,
      savingsGoal: Number(t.savings_goal ?? 0),
      savedTotal,
    });
  }
  return results;
}

export async function createTrip(
  familyId: string,
  userId: string,
  category: TripCategory,
  title: string,
  destination: string,
  savingsGoal: number
) {
  const { error } = await supabase.from("trips").insert({
    family_id: familyId,
    category,
    title,
    destination,
    savings_goal: savingsGoal,
    created_by: userId,
  });
  if (error) throw error;
}

export async function addSavingsContribution(tripId: string, profileId: string, amount: number) {
  const { error } = await supabase
    .from("trip_savings_contributions")
    .insert({ trip_id: tripId, profile_id: profileId, amount });
  if (error) throw error;
}

export async function fetchTripExpenses(tripId: string): Promise<TripExpense[]> {
  const { data, error } = await supabase
    .from("trip_expenses")
    .select("id, category, description, amount, paid_by")
    .eq("trip_id", tripId)
    .order("expense_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    category: r.category,
    description: r.description,
    amount: Number(r.amount),
    paidBy: r.paid_by,
  }));
}

export async function addTripExpense(
  tripId: string,
  category: ExpenseCategory,
  description: string,
  amount: number,
  paidBy: string
) {
  const { error } = await supabase
    .from("trip_expenses")
    .insert({ trip_id: tripId, category, description, amount, paid_by: paidBy });
  if (error) throw error;
}

export async function fetchItinerary(tripId: string): Promise<TripItineraryItem[]> {
  const { data, error } = await supabase
    .from("trip_itinerary_items")
    .select("id, day_date, time_of_day, title, type, location, notes")
    .eq("trip_id", tripId)
    .order("day_date", { ascending: true, nullsFirst: true })
    .order("time_of_day", { ascending: true, nullsFirst: true });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    dayDate: r.day_date,
    timeOfDay: r.time_of_day,
    title: r.title,
    type: r.type,
    location: r.location,
    notes: r.notes,
  }));
}

export async function addItineraryItem(
  tripId: string,
  dayDate: string | null,
  timeOfDay: string | null,
  title: string,
  type: string,
  location: string
) {
  const { error } = await supabase.from("trip_itinerary_items").insert({
    trip_id: tripId,
    day_date: dayDate || null,
    time_of_day: timeOfDay || null,
    title,
    type,
    location,
  });
  if (error) throw error;
}

export async function deleteItineraryItem(id: string) {
  const { error } = await supabase.from("trip_itinerary_items").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchFundingSources(tripId: string): Promise<FundingSource[]> {
  const { data, error } = await supabase
    .from("trip_funding_sources")
    .select("id, type, name, planned_amount, received_amount, notes")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    type: r.type,
    name: r.name,
    plannedAmount: Number(r.planned_amount),
    receivedAmount: Number(r.received_amount),
    notes: r.notes,
  }));
}

export async function addFundingSource(
  tripId: string,
  type: FundingSourceType,
  name: string,
  plannedAmount: number
) {
  const { error } = await supabase
    .from("trip_funding_sources")
    .insert({ trip_id: tripId, type, name, planned_amount: plannedAmount });
  if (error) throw error;
}

export async function updateFundingReceived(id: string, receivedAmount: number) {
  const { error } = await supabase
    .from("trip_funding_sources")
    .update({ received_amount: receivedAmount })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteFundingSource(id: string) {
  const { error } = await supabase.from("trip_funding_sources").delete().eq("id", id);
  if (error) throw error;
}
