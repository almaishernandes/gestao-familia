import { supabase } from "@/lib/supabaseClient";

export interface BankAccount {
  id: string;
  name: string;
  institution: string | null;
  accountType: string | null;
  currentBalance: number;
  isPrivate: boolean;
  ownerProfileId: string | null;
}

export interface Transaction {
  id: string;
  kind: "receita" | "despesa_fixa" | "despesa_variavel";
  category: string | null;
  description: string;
  amount: number;
  isPaid: boolean;
  dueDate: string | null;
}

export async function fetchAccounts(familyId: string): Promise<BankAccount[]> {
  const { data, error } = await supabase
    .from("bank_accounts")
    .select("id, name, institution, account_type, current_balance, is_private, owner_profile_id")
    .eq("family_id", familyId);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    institution: r.institution,
    accountType: r.account_type,
    currentBalance: Number(r.current_balance),
    isPrivate: r.is_private,
    ownerProfileId: r.owner_profile_id,
  }));
}

export async function createAccount(
  familyId: string,
  name: string,
  accountType: string,
  balance: number,
  ownerProfileId: string | null,
  isPrivate: boolean
) {
  const { error } = await supabase.from("bank_accounts").insert({
    family_id: familyId,
    name,
    account_type: accountType,
    current_balance: balance,
    owner_profile_id: ownerProfileId,
    is_private: isPrivate,
  });
  if (error) throw error;
}

export async function fetchTransactions(familyId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, kind, category, description, amount, is_paid, due_date")
    .eq("family_id", familyId)
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    kind: r.kind,
    category: r.category,
    description: r.description,
    amount: Number(r.amount),
    isPaid: r.is_paid,
    dueDate: r.due_date,
  }));
}

export async function createTransaction(
  familyId: string,
  userId: string,
  kind: Transaction["kind"],
  description: string,
  amount: number,
  category: string,
  dueDate: string | null
) {
  const { error } = await supabase.from("transactions").insert({
    family_id: familyId,
    kind,
    description,
    amount,
    category,
    due_date: dueDate,
    created_by: userId,
  });
  if (error) throw error;
}

export async function togglePaid(id: string, isPaid: boolean) {
  const { error } = await supabase
    .from("transactions")
    .update({ is_paid: isPaid, paid_at: isPaid ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;
}
