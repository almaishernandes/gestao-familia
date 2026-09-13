import { useEffect, useState, useCallback } from "react";
import { fetchMyFamily } from "@/services/familyService";
import { useAppStore } from "@/stores/useAppStore";

/**
 * Carrega a família do usuário logado (se já pertence a uma) e popula o
 * useAppStore. Enquanto não houver família, o app deve mostrar o onboarding.
 */
export function useFamilyContext(userId: string | undefined) {
  const setFamilyContext = useAppStore((s) => s.setFamilyContext);
  const [loading, setLoading] = useState(true);
  const [hasFamily, setHasFamily] = useState(false);

  const reload = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await fetchMyFamily(userId);
    if (result) {
      setFamilyContext(result.familyId, userId, result.members);
      setHasFamily(true);
    } else {
      setHasFamily(false);
    }
    setLoading(false);
  }, [userId, setFamilyContext]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { loading, hasFamily, reload };
}
