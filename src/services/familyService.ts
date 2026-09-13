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
