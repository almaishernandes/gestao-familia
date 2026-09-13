import { supabase } from "@/lib/supabaseClient";

export async function createPost(
  familyId: string,
  authorId: string,
  type: "aviso" | "recado" | "conquista" | "foto",
  content: string
) {
  const { error } = await supabase.from("feed_posts").insert({
    family_id: familyId,
    author_id: authorId,
    type,
    content,
  });
  if (error) throw error;
}
