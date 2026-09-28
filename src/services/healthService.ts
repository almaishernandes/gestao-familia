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

// ---------------------------------------------------------------------------
// Receituário (prescriptions)
// ---------------------------------------------------------------------------

export interface PrescriptionItem {
  name: string;
  dosage: string;
  instructions: string;
  quantity: string;
  prices?: Record<string, string>;
}

export interface Prescription {
  id: string;
  profileId: string;
  doctorName: string | null;
  doctorCrm: string | null;
  specialty: string | null;
  issuedDate: string;
  validityDate: string | null;
  items: PrescriptionItem[];
  notes: string | null;
  storagePath: string | null;
}

const MEDICAL_DOCS_BUCKET = "medical-documents";

export async function getMedicalDocumentUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from(MEDICAL_DOCS_BUCKET).createSignedUrl(storagePath, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}

const PHARMACIES = [
  { label: "Droga Raia", domain: "drogaraia.com.br" },
  { label: "Drogasil", domain: "drogasil.com.br" },
  { label: "Pague Menos", domain: "paguemenos.com.br" },
  { label: "Panvel", domain: "panvel.com" },
  { label: "Ultrafarma", domain: "ultrafarma.com.br" },
];

export const PHARMACY_LABELS = PHARMACIES.map((p) => p.label);

export function buildPriceSearchLinks(medicationName: string) {
  const term = encodeURIComponent(medicationName.trim());
  return [
    { label: "Comparar no Google", url: `https://www.google.com/search?tbm=shop&q=${term}` },
    ...PHARMACIES.map((p) => ({
      label: p.label,
      url: `https://www.google.com/search?q=${term}+site:${p.domain}`,
    })),
  ];
}

export async function fetchPrescriptions(familyId: string): Promise<Prescription[]> {
  const { data, error } = await supabase
    .from("prescriptions")
    .select("id, profile_id, doctor_name, doctor_crm, specialty, issued_date, validity_date, items, notes, storage_path")
    .eq("family_id", familyId)
    .order("issued_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    profileId: r.profile_id,
    doctorName: r.doctor_name,
    doctorCrm: r.doctor_crm,
    specialty: r.specialty,
    issuedDate: r.issued_date,
    validityDate: r.validity_date,
    items: r.items ?? [],
    notes: r.notes,
    storagePath: r.storage_path,
  }));
}

export async function addPrescription(
  familyId: string,
  userId: string,
  profileId: string,
  doctorName: string,
  doctorCrm: string,
  specialty: string,
  issuedDate: string,
  validityDate: string,
  items: PrescriptionItem[],
  notes: string,
  photoFile?: File | null
) {
  let storagePath: string | null = null;
  if (photoFile) {
    storagePath = `${familyId}/${Date.now()}-${photoFile.name}`;
    const { error: uploadError } = await supabase.storage.from(MEDICAL_DOCS_BUCKET).upload(storagePath, photoFile);
    if (uploadError) throw uploadError;
  }

  const { error } = await supabase.from("prescriptions").insert({
    family_id: familyId,
    profile_id: profileId,
    doctor_name: doctorName,
    doctor_crm: doctorCrm || null,
    specialty: specialty || null,
    issued_date: issuedDate,
    validity_date: validityDate || null,
    items,
    notes: notes || null,
    created_by: userId,
    storage_path: storagePath,
  });
  if (error) throw error;
}

export async function deletePrescription(id: string) {
  const { error } = await supabase.from("prescriptions").delete().eq("id", id);
  if (error) throw error;
}

export async function updatePrescriptionItems(id: string, items: PrescriptionItem[]) {
  const { error } = await supabase.from("prescriptions").update({ items }).eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Exames médicos (medical_exams)
// ---------------------------------------------------------------------------

export type ExamStatus = "agendado" | "realizado" | "aguardando_resultado" | "concluido";

export interface MedicalExam {
  id: string;
  profileId: string;
  examName: string;
  examType: string | null;
  requestedByDoctor: string | null;
  labName: string | null;
  scheduledAt: string | null;
  resultDate: string | null;
  status: ExamStatus;
  resultSummary: string | null;
}

export async function fetchExams(familyId: string): Promise<MedicalExam[]> {
  const { data, error } = await supabase
    .from("medical_exams")
    .select(
      "id, profile_id, exam_name, exam_type, requested_by_doctor, lab_name, scheduled_at, result_date, status, result_summary"
    )
    .eq("family_id", familyId)
    .order("scheduled_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    profileId: r.profile_id,
    examName: r.exam_name,
    examType: r.exam_type,
    requestedByDoctor: r.requested_by_doctor,
    labName: r.lab_name,
    scheduledAt: r.scheduled_at,
    resultDate: r.result_date,
    status: r.status,
    resultSummary: r.result_summary,
  }));
}

export async function addExam(
  familyId: string,
  userId: string,
  profileId: string,
  examName: string,
  examType: string,
  requestedByDoctor: string,
  labName: string,
  scheduledAt: string
) {
  const { error } = await supabase.from("medical_exams").insert({
    family_id: familyId,
    profile_id: profileId,
    exam_name: examName,
    exam_type: examType || null,
    requested_by_doctor: requestedByDoctor || null,
    lab_name: labName || null,
    scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
    created_by: userId,
  });
  if (error) throw error;
}

export async function updateExamStatus(id: string, status: ExamStatus, resultSummary?: string) {
  const { error } = await supabase
    .from("medical_exams")
    .update({
      status,
      result_date: status === "concluido" ? new Date().toISOString().slice(0, 10) : null,
      result_summary: resultSummary ?? null,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteExam(id: string) {
  const { error } = await supabase.from("medical_exams").delete().eq("id", id);
  if (error) throw error;
}
