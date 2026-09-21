import { supabase } from "@/lib/supabaseClient";
import type { FamilyMember } from "@/types/domain";

/**
 * Retorna a primeira família do usuário logado com a lista de membros.
 * (Suporte a múltiplas famílias por usuário fica para uma versão futura
 * de seletor de família.)
 */
export async function fetchMyFamily(userId: string) {
  const { data: membership, error: membershipError } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("profile_id", userId)
    .limit(1)
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership) return null;

  const familyId = membership.family_id as string;

  const { data: members, error: membersError } = await supabase
    .from("family_members")
    .select("role, can_view_finances, profiles(id, full_name, avatar_url)")
    .eq("family_id", familyId);

  if (membersError) throw membersError;

  const familyMembers: FamilyMember[] = (members ?? []).map((row: any) => ({
    id: row.profiles.id,
    fullName: row.profiles.full_name,
    avatarUrl: row.profiles.avatar_url,
    role: row.role,
    canViewFinances: row.can_view_finances,
  }));

  return { familyId, members: familyMembers };
}

export interface SubscriptionInfo {
  status: "trial" | "ativa" | "atrasada" | "cancelada";
  trialEndsAt: string | null;
  nextDueAt: string | null;
}

export async function fetchSubscriptionInfo(familyId: string): Promise<SubscriptionInfo | null> {
  const { data, error } = await supabase
    .from("families")
    .select("subscription_status, trial_ends_at, next_due_at")
    .eq("id", familyId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    status: data.subscription_status,
    trialEndsAt: data.trial_ends_at,
    nextDueAt: data.next_due_at,
  };
}

export async function fetchInviteCode(familyId: string): Promise<string | null> {
  const { data, error } = await supabase.from("families").select("invite_code").eq("id", familyId).maybeSingle();
  if (error) throw error;
  return data?.invite_code ?? null;
}

export interface ProfileDetails {
  fullName: string;
  displayName: string | null;
  birthDate: string | null;
  phone: string | null;
  role: "owner" | "adult" | "dependent";
  canViewFinances: boolean;
}

export async function fetchProfileDetails(familyId: string, profileId: string): Promise<ProfileDetails | null> {
  const { data, error } = await supabase
    .from("family_members")
    .select("role, can_view_finances, profiles(full_name, display_name, birth_date, phone)")
    .eq("family_id", familyId)
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const profile: any = data.profiles;
  return {
    fullName: profile.full_name,
    displayName: profile.display_name,
    birthDate: profile.birth_date,
    phone: profile.phone,
    role: data.role,
    canViewFinances: data.can_view_finances,
  };
}

export async function updateProfileDetails(
  familyId: string,
  profileId: string,
  fields: { fullName: string; displayName: string; birthDate: string; phone: string; canViewFinances: boolean }
) {
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: fields.fullName,
      display_name: fields.displayName || null,
      birth_date: fields.birthDate || null,
      phone: fields.phone || null,
    })
    .eq("id", profileId);
  if (profileError) throw profileError;

  const { error: memberError } = await supabase
    .from("family_members")
    .update({ can_view_finances: fields.canViewFinances })
    .eq("family_id", familyId)
    .eq("profile_id", profileId);
  if (memberError) throw memberError;
}
