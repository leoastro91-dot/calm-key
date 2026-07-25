/**
 * Hooks del feature Configuración — LOVABLE-008.
 * Lectura y actualización de la distribución 50/30/20 en `financial_profiles`.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { useWorkspace } from "@/features/identity/hooks/useWorkspace";
import { financialProfileRepository } from "../services/financialProfileRepository";

export function useFinancialProfile() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: ["configuracion", "financial-profile", workspace?.id],
    enabled: Boolean(user && workspace),
    queryFn: () =>
      financialProfileRepository.getByUser(user!.id, workspace!.id),
  });
}

export function useUpdateDistribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      needs_pct: number;
      wants_pct: number;
      construction_pct: number;
    }) => {
      await financialProfileRepository.updateDistribution(input.id, {
        needs_pct: input.needs_pct,
        wants_pct: input.wants_pct,
        construction_pct: input.construction_pct,
      });
    },
    onSuccess: () => {
      // Invalidar tanto la vista de configuración como la de presupuesto
      // (LOVABLE-006 calcula el objetivo por bloque desde este perfil).
      qc.invalidateQueries({ queryKey: ["configuracion"] });
      qc.invalidateQueries({ queryKey: ["budget"] });
    },
  });
}
