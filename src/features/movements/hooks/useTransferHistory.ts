/**
 * Historial enriquecido de traslados internos (transfer + emergency_use)
 * con cuenta/bolsillo origen y destino resueltos por lookup en memoria.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { useWorkspace } from "@/features/identity/hooks/useWorkspace";
import { accountRepository } from "@/features/accounts/services/accountRepository";
import { pocketRepository } from "@/features/accounts/services/pocketRepository";
import { transferTransactionRepository } from "../services/transactionRepository";
import type { Account, Pocket } from "@/features/accounts/domain/types";
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
      const [transfers, accounts, pockets] = await Promise.all([
        transferTransactionRepository.listByWorkspace(userId, wsId),
        accountRepository.listByWorkspace(userId, wsId),
        pocketRepository.listByWorkspace(userId, wsId),
      ]);
      return { transfers, accounts, pockets };
    },
  });

  const items: TransferHistoryItem[] = useMemo(() => {
    if (!query.data) return [];
    const { transfers, accounts, pockets } = query.data;
    const acctById = new Map<string, Account>(accounts.map((a) => [a.id, a]));
    const pocketById = new Map<string, Pocket>(pockets.map((p) => [p.id, p]));
    return transfers.map((t) => ({
      ...t,
      fromAccount: acctById.get(t.account_id) ?? null,
      fromPocket: pocketById.get(t.pocket_id) ?? null,
      toAccount: t.to_account_id ? (acctById.get(t.to_account_id) ?? null) : null,
      toPocket: t.to_pocket_id ? (pocketById.get(t.to_pocket_id) ?? null) : null,
    }));
  }, [query.data]);

  return {
    items,
    accounts: query.data?.accounts ?? [],
    pockets: query.data?.pockets ?? [],
    isLoading: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
  };
}
