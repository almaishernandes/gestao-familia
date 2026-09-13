import { supabase } from "@/lib/supabaseClient";

export interface Trip {
  id: string;
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
  description: string;
  amount: number;
  paidBy: string | null;
}

export async function fetchTrips(familyId: string): Promise<Trip[]> {
  const { data, error } = await supabase
    .from("trips")
    .select("id, title, destination, start_date, end_date, status, savings_goal")
    .eq("family_id", familyId)
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
  title: string,
  destination: string,
  savingsGoal: number
) {
  const { error } = await supabase.from("trips").insert({
    family_id: familyId,
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
    .select("id, description, amount, paid_by")
    .eq("trip_id", tripId)
    .order("expense_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    description: r.description,
    amount: Number(r.amount),
    paidBy: r.paid_by,
  }));
}

export async function addTripExpense(tripId: string, description: string, amount: number, paidBy: string) {
  const { error } = await supabase
    .from("trip_expenses")
    .insert({ trip_id: tripId, description, amount, paid_by: paidBy });
  if (error) throw error;
}
