/**
 * Datos combinados de /presupuesto: perfil financiero, período activo,
 * budget del período (creado si no existe), líneas del budget y catálogo
 * de categorías.
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { useWorkspace } from "@/features/identity/hooks/useWorkspace";
import { financialPeriodRepository } from "@/features/income/services/financialPeriodRepository";
import { financialProfileRepository } from "@/features/onboarding/services/financialProfileRepository";
import { budgetRepository } from "../services/budgetRepository";
import { budgetItemRepository } from "../services/budgetItemRepository";
import { categoryRepository } from "../services/categoryRepository";

export function useFinancialProfile() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: ["budget", "financial-profile", workspace?.id],
    enabled: Boolean(user && workspace),
    queryFn: () =>
      financialProfileRepository.getByUser(user!.id, workspace!.id),
  });
}

export function useActivePeriod() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: ["budget", "active-period", workspace?.id],
    enabled: Boolean(user && workspace),
    queryFn: () =>
      financialPeriodRepository.getActive(user!.id, workspace!.id),
  });
}

export function useActiveBudget(financialPeriodId: string | null | undefined) {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: ["budget", "active", financialPeriodId],
    enabled: Boolean(user && workspace && financialPeriodId),
    queryFn: () =>
      budgetRepository.getOrCreateForActivePeriod({
        user_id: user!.id,
        workspace_id: workspace!.id,
        financial_period_id: financialPeriodId!,
      }),
  });
}

export function useBudgetItems(budgetId: string | null | undefined) {
  return useQuery({
    queryKey: ["budget", "items", budgetId],
    enabled: Boolean(budgetId),
    queryFn: () => budgetItemRepository.listByBudget(budgetId!),
  });
}

export function useAvailableCategories() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: ["budget", "categories", workspace?.id],
    enabled: Boolean(user && workspace),
    queryFn: () =>
      categoryRepository.listAvailable(user!.id, workspace!.id),
  });
}
