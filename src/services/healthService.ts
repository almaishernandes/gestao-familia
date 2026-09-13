import { supabase } from "@/lib/supabaseClient";

export interface HealthProfile {
  profileId: string;
  bloodType: string | null;
  allergies: string[];
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
}

export interface Medication {
  id: string;
  profileId: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  isActive: boolean;
}

export async function fetchHealthProfile(profileId: string): Promise<HealthProfile | null> {
  const { data, error } = await supabase
    .from("health_profiles")
    .select("profile_id, blood_type, allergies, emergency_contact_name, emergency_contact_phone")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    profileId: data.profile_id,
    bloodType: data.blood_type,
    allergies: data.allergies ?? [],
    emergencyContactName: data.emergency_contact_name,
    emergencyContactPhone: data.emergency_contact_phone,
  };
}

export async function upsertHealthProfile(
  familyId: string,
  profileId: string,
  fields: Partial<Omit<HealthProfile, "profileId">>
) {
  const { error } = await supabase.from("health_profiles").upsert(
    {
      family_id: familyId,
      profile_id: profileId,
      blood_type: fields.bloodType,
      allergies: fields.allergies,
      emergency_contact_name: fields.emergencyContactName,
      emergency_contact_phone: fields.emergencyContactPhone,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "profile_id" }
  );
  if (error) throw error;
}

export async function fetchMedications(familyId: string): Promise<Medication[]> {
  const { data, error } = await supabase
    .from("medications")
    .select("id, profile_id, name, dosage, frequency, is_active")
    .eq("family_id", familyId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    profileId: r.profile_id,
    name: r.name,
    dosage: r.dosage,
    frequency: r.frequency,
    isActive: r.is_active,
  }));
}

export async function addMedication(
  familyId: string,
  profileId: string,
  name: string,
  dosage: string,
  frequency: string
) {
  const { error } = await supabase
    .from("medications")
    .insert({ family_id: familyId, profile_id: profileId, name, dosage, frequency });
  if (error) throw error;
}

export async function deactivateMedication(id: string) {
  const { error } = await supabase.from("medications").update({ is_active: false }).eq("id", id);
  if (error) throw error;
}
