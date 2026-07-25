/**
 * Configura la meta (`target_amount`) de un bolsillo existente.
 * Ninguna transacción se crea: es solo un UPDATE en `pockets`.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pocketRepository } from "@/features/accounts/services/pocketRepository";

export function useConfigureGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      pocket_id: string;
      target_amount: number | null;
    }) => {
      if (input.target_amount != null && input.target_amount <= 0) {
        throw new Error("TARGET_MUST_BE_POSITIVE");
      }
      return pocketRepository.updateTarget(input.pocket_id, input.target_amount);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
