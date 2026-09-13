import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Comment } from "@/types/domain";

/**
 * Comentários em tempo real para qualquer entidade (lista de compras, viagem,
 * medicamento, cardápio...). Assina o canal Realtime filtrado por entity_id.
 */
export function useRealtimeComments(entityType: string, entityId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data } = await supabase
        .from("comments")
        .select("id, entity_type, entity_id, author_id, content, created_at, profiles(full_name)")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: true });

      if (active && data) {
        setComments(
          data.map((row: any) => ({
            id: row.id,
            entityType: row.entity_type,
            entityId: row.entity_id,
            authorId: row.author_id,
            authorName: row.profiles?.full_name ?? "Membro",
            content: row.content,
            createdAt: row.created_at,
          }))
        );
      }
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel(`comments:${entityType}:${entityId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments", filter: `entity_id=eq.${entityId}` },
        (payload) => {
          const row = payload.new as any;
          setComments((prev) => [
            ...prev,
            {
              id: row.id,
              entityType: row.entity_type,
              entityId: row.entity_id,
              authorId: row.author_id,
              authorName: "Membro",
              content: row.content,
              createdAt: row.created_at,
            },
          ]);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [entityType, entityId]);

  const sendComment = useCallback(
    async (familyId: string, authorId: string, content: string) => {
      await supabase.from("comments").insert({
        family_id: familyId,
        entity_type: entityType,
        entity_id: entityId,
        author_id: authorId,
        content,
      });
    },
    [entityType, entityId]
  );

  return { comments, loading, sendComment };
}
