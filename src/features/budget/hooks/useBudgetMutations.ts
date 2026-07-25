/**
 * Mutaciones del presupuesto: agregar, editar monto proyectado y eliminar
 * línea. Delegan en budgetItemRepository; invalidan las queries del feature.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { useWorkspace } from "@/features/identity/hooks/useWorkspace";
import { budgetItemRepository } from "../services/budgetItemRepository";

export function useAddBudgetItem() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      budget_id: string;
      category_id: string;
      projected_amount: number;
    }) => {
      if (!user || !workspace) throw new Error("SESSION_NOT_READY");
      if (input.projected_amount <= 0) throw new Error("AMOUNT_MUST_BE_POSITIVE");
      return budgetItemRepository.create({
        budget_id: input.budget_id,
        user_id: user.id,
        workspace_id: workspace.id,
        category_id: input.category_id,
        projected_amount: input.projected_amount,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budget"] }),
  });
}

export function useUpdateBudgetItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; projected_amount: number }) => {
      if (input.projected_amount <= 0) throw new Error("AMOUNT_MUST_BE_POSITIVE");
      await budgetItemRepository.updateProjected(input.id, input.projected_amount);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budget"] }),
  });
}

export function useDeleteBudgetItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; actual_amount: number }) => {
      if (input.actual_amount !== 0) throw new Error("HAS_EXECUTION");
      await budgetItemRepository.remove(input.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budget"] }),
  });
}
