/**
 * Historial enriquecido de traslados internos (transfer + emergency_use)
 * con cuenta/bolsillo origen y destino resueltos por lookup en memoria.
 * v1.1: también resuelve categoría opcional para mostrar en el historial.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { useWorkspace } from "@/features/identity/hooks/useWorkspace";
import { accountRepository } from "@/features/accounts/services/accountRepository";
import { pocketRepository } from "@/features/accounts/services/pocketRepository";
import { categoryRepository } from "@/features/budget/services/categoryRepository";
import { transferTransactionRepository } from "../services/transactionRepository";
import type { Account, Pocket } from "@/features/accounts/domain/types";
import type { Category } from "@/features/budget/domain/types";
import type { TransferHistoryItem } from "../domain/types";

export function useTransferHistory() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();

  const query = useQuery({
    queryKey: ["movements", "history", workspace?.id],
    enabled: Boolean(user && workspace),
    queryFn: async () => {
      const userId = user!.id;
      const wsId = workspace!.id;
      const [transfers, accounts, pockets, categories] = await Promise.all([
        transferTransactionRepository.listByWorkspace(userId, wsId),
        accountRepository.listByWorkspace(userId, wsId),
        pocketRepository.listByWorkspace(userId, wsId),
        categoryRepository.listAvailable(userId, wsId),
      ]);
      return { transfers, accounts, pockets, categories };
    },
  });

  const items: TransferHistoryItem[] = useMemo(() => {
    if (!query.data) return [];
    const { transfers, accounts, pockets, categories } = query.data;
    const acctById = new Map<string, Account>(accounts.map((a) => [a.id, a]));
    const pocketById = new Map<string, Pocket>(pockets.map((p) => [p.id, p]));
    const catById = new Map<string, Category>(categories.map((c) => [c.id, c]));
    return transfers.map((t) => {
      const cat = t.category_id ? (catById.get(t.category_id) ?? null) : null;
      return {
        ...t,
        fromAccount: acctById.get(t.account_id) ?? null,
        fromPocket: pocketById.get(t.pocket_id) ?? null,
        toAccount: t.to_account_id ? (acctById.get(t.to_account_id) ?? null) : null,
        toPocket: t.to_pocket_id ? (pocketById.get(t.to_pocket_id) ?? null) : null,
        category: cat
          ? { id: cat.id, name: cat.name, block_5030: cat.block_5030 }
          : null,
      };
    });
  }, [query.data]);

  return {
    items,
    accounts: query.data?.accounts ?? [],
    pockets: query.data?.pockets ?? [],
    categories: query.data?.categories ?? [],
    isLoading: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
  };
}
