import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import * as shoppingService from "@/services/shoppingService";
import type { ShoppingList } from "@/services/shoppingService";
import { useAppStore } from "@/stores/useAppStore";

export function useShoppingLists() {
  const familyId = useAppStore((s) => s.familyId);
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!familyId) return;
    setLoading(true);
    const data = await shoppingService.fetchLists(familyId);
    setLists(data);
    setLoading(false);
  }, [familyId]);

  useEffect(() => {
    reload();
    if (!familyId) return;

    const channel = supabase
      .channel(`shopping_lists:${familyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shopping_lists", filter: `family_id=eq.${familyId}` },
        () => reload()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, reload]);

  return { lists, loading, reload };
}
