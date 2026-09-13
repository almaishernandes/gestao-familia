import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import * as shoppingService from "@/services/shoppingService";
import type { ShoppingItem } from "@/services/shoppingService";

export function useShoppingItems(listId: string | null) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!listId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await shoppingService.fetchItems(listId);
    setItems(data);
    setLoading(false);
  }, [listId]);

  useEffect(() => {
    reload();
    if (!listId) return;

    const channel = supabase
      .channel(`shopping_items:${listId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shopping_items", filter: `list_id=eq.${listId}` },
        () => reload()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listId, reload]);

  return { items, loading, reload };
}
