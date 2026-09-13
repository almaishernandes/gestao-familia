import { supabase } from "@/lib/supabaseClient";

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function createFamily(name: string, fullName: string) {
  const { data, error } = await supabase
    .rpc("create_family", { p_name: name, p_full_name: fullName })
    .single();
  if (error) throw error;
  return data as { family_id: string; invite_code: string };
}

export async function joinFamilyByCode(inviteCode: string, fullName: string) {
  const { data, error } = await supabase.rpc("join_family_by_code", {
    p_invite_code: inviteCode,
    p_full_name: fullName,
  });
  if (error) throw error;
  return data as string; // family_id
}
