/**
 * Historial enriquecido de gastos del período activo, con cuenta/bolsillo/
 * categoría/subcategoría resueltos por lookup en memoria.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { useWorkspace } from "@/features/identity/hooks/useWorkspace";
import { accountRepository } from "@/features/accounts/services/accountRepository";
import { pocketRepository } from "@/features/accounts/services/pocketRepository";
import { categoryRepository } from "@/features/budget/services/categoryRepository";
import { financialPeriodRepository } from "@/features/income/services/financialPeriodRepository";
import type { Account, Pocket } from "@/features/accounts/domain/types";
import type { Category } from "@/features/budget/domain/types";
import { expenseTransactionRepository } from "../services/transactionRepository";
import { subcategoryRepository } from "../services/subcategoryRepository";
import type { ExpenseHistoryItem, Subcategory } from "../domain/types";

export function useExpenseHistory() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();

  const periodQ = useQuery({
    queryKey: ["expenses", "active-period", workspace?.id],
    enabled: Boolean(user && workspace),
    queryFn: () => financialPeriodRepository.getActive(user!.id, workspace!.id),
  });

  const catalogQ = useQuery({
    queryKey: ["expenses", "catalog", workspace?.id],
    enabled: Boolean(user && workspace),
    queryFn: async () => {
      const [accounts, pockets, categories, subcategories] = await Promise.all([
        accountRepository.listByWorkspace(user!.id, workspace!.id),
        pocketRepository.listByWorkspace(user!.id, workspace!.id),
        categoryRepository.listAvailable(user!.id, workspace!.id),
        subcategoryRepository.listAll(),
      ]);
      return { accounts, pockets, categories, subcategories };
    },
  });

  const listQ = useQuery({
    queryKey: ["expenses", "list", periodQ.data?.id],
    enabled: Boolean(user && workspace && periodQ.data?.id),
    queryFn: () =>
      expenseTransactionRepository.listByPeriod(
        user!.id,
        workspace!.id,
        periodQ.data!.id,
      ),
  });

  const items: ExpenseHistoryItem[] = useMemo(() => {
    if (!listQ.data || !catalogQ.data) return [];
    const { accounts, pockets, categories, subcategories } = catalogQ.data;
    const acctById = new Map<string, Account>(accounts.map((a) => [a.id, a]));
    const pocketById = new Map<string, Pocket>(pockets.map((p) => [p.id, p]));
    const catById = new Map<string, Category>(categories.map((c) => [c.id, c]));
    const subById = new Map<string, Subcategory>(
      subcategories.map((s) => [s.id, s]),
    );
    return listQ.data.map((row) => ({
      ...row,
      account: acctById.get(row.account_id) ?? null,
      pocket: pocketById.get(row.pocket_id) ?? null,
      categoryName: row.category_id
        ? (catById.get(row.category_id)?.name ?? null)
        : null,
      subcategoryName: row.subcategory_id
        ? (subById.get(row.subcategory_id)?.name ?? null)
        : null,
    }));
  }, [listQ.data, catalogQ.data]);

  return {
    items,
    period: periodQ.data ?? null,
    accounts: catalogQ.data?.accounts ?? [],
    pockets: catalogQ.data?.pockets ?? [],
    categories: catalogQ.data?.categories ?? [],
    subcategories: catalogQ.data?.subcategories ?? [],
    isLoading: periodQ.isPending || catalogQ.isPending || listQ.isPending,
    isError: periodQ.isError || catalogQ.isError || listQ.isError,
    refetch: () => {
      periodQ.refetch();
      catalogQ.refetch();
      listQ.refetch();
    },
  };
}
