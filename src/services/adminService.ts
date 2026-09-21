import { supabase } from "@/lib/supabaseClient";

export async function checkIsPlatformAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_platform_admin");
  if (error) throw error;
  return !!data;
}

export interface AdminFamilyRow {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
  memberCount: number;
}

export async function fetchAllFamilies(): Promise<AdminFamilyRow[]> {
  const { data: families, error } = await supabase
    .from("families")
    .select("id, name, invite_code, created_at")
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
  }));
}

export async function adminCreateFamily(name: string): Promise<{ familyId: string; inviteCode: string }> {
  const { data, error } = await supabase.rpc("admin_create_family", { p_name: name }).single();
  if (error) throw error;
  const row = data as any;
  return { familyId: row.family_id, inviteCode: row.invite_code };
}
