import { supabase } from "@/lib/supabaseClient";

export async function checkIsPlatformAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_platform_admin");
  if (error) throw error;
  return !!data;
}

export type SubscriptionStatus = "trial" | "ativa" | "atrasada" | "cancelada";

export interface AdminFamilyRow {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
  memberCount: number;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPrice: number | null;
  trialEndsAt: string | null;
  nextDueAt: string | null;
  lastPaymentAt: string | null;
  paymentNotes: string | null;
}

export async function fetchAllFamilies(): Promise<AdminFamilyRow[]> {
  const { data: families, error } = await supabase
    .from("families")
    .select(
      "id, name, invite_code, created_at, subscription_status, subscription_price, trial_ends_at, next_due_at, last_payment_at, payment_notes"
    )
    .order("created_at", { ascending: false });
  if (error) throw error;

  const { data: members, error: membersError } = await supabase.from("family_members").select("family_id");
  if (membersError) throw membersError;

  const counts = new Map<string, number>();
  for (const m of members ?? []) {
    counts.set(m.family_id, (counts.get(m.family_id) ?? 0) + 1);
  }

  return (families ?? []).map((f: any) => ({
    id: f.id,
    name: f.name,
    inviteCode: f.invite_code,
    createdAt: f.created_at,
    memberCount: counts.get(f.id) ?? 0,
    subscriptionStatus: f.subscription_status,
    subscriptionPrice: f.subscription_price !== null ? Number(f.subscription_price) : null,
    trialEndsAt: f.trial_ends_at,
    nextDueAt: f.next_due_at,
    lastPaymentAt: f.last_payment_at,
    paymentNotes: f.payment_notes,
  }));
}

export async function adminCreateFamily(name: string): Promise<{ familyId: string; inviteCode: string }> {
  const { data, error } = await supabase.rpc("admin_create_family", { p_name: name }).single();
  if (error) throw error;
  const row = data as any;
  return { familyId: row.family_id, inviteCode: row.invite_code };
}

export async function adminDeleteFamily(familyId: string) {
  const { error } = await supabase.rpc("admin_delete_family", { p_family_id: familyId });
  if (error) throw error;
}

export async function adminUpdateSubscription(
  familyId: string,
  status: SubscriptionStatus,
  price: number | null,
  nextDueAt: string | null,
  lastPaymentAt: string | null,
  notes: string | null
) {
  const { error } = await supabase.rpc("admin_update_subscription", {
    p_family_id: familyId,
    p_status: status,
    p_price: price,
    p_next_due_at: nextDueAt,
    p_last_payment_at: lastPaymentAt,
    p_notes: notes,
  });
  if (error) throw error;
}
