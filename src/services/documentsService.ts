import { supabase } from "@/lib/supabaseClient";

export interface HouseDocument {
  id: string;
  title: string;
  category: string | null;
  storagePath: string;
  createdAt: string;
}

const BUCKET = "house-documents";

export async function fetchDocuments(familyId: string): Promise<HouseDocument[]> {
  const { data, error } = await supabase
    .from("house_documents")
    .select("id, title, category, storage_path, created_at")
    .eq("family_id", familyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    storagePath: r.storage_path,
    createdAt: r.created_at,
  }));
}

export async function uploadDocument(
  familyId: string,
  userId: string,
  file: File,
  title: string,
  category: string
) {
  const path = `${familyId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);
  if (uploadError) throw uploadError;

  const { error } = await supabase.from("house_documents").insert({
    family_id: familyId,
    title,
    category,
    storage_path: path,
    uploaded_by: userId,
  });
  if (error) throw error;
}

export async function getDocumentUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}
