import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAppStore } from "@/stores/useAppStore";
import type { FeedPost } from "@/types/domain";

export function useFamilyFeed() {
  const familyId = useAppStore((s) => s.familyId);
  const [posts, setPosts] = useState<FeedPost[]>([]);

  useEffect(() => {
    if (!familyId) return;
    let active = true;

    async function load() {
      const { data } = await supabase
        .from("feed_posts")
        .select("id, author_id, type, content, media_url, created_at, profiles(full_name, avatar_url)")
        .eq("family_id", familyId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (active && data) {
        setPosts(
          data.map((row: any) => ({
            id: row.id,
            authorId: row.author_id,
            authorName: row.profiles?.full_name ?? "Membro",
            authorAvatarUrl: row.profiles?.avatar_url,
            type: row.type,
            content: row.content,
            mediaUrl: row.media_url,
            createdAt: row.created_at,
          }))
        );
      }
    }
    load();

    const channel = supabase
      .channel(`feed:${familyId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "feed_posts", filter: `family_id=eq.${familyId}` },
        () => load()
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [familyId]);

  return posts;
}
