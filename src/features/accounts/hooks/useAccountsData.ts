/**
 * Consulta unificada: cuentas + bolsillos del workspace del usuario.
 * Los agrupa por cuenta y calcula los totales por money_state.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { useWorkspace } from "@/features/identity/hooks/useWorkspace";
import { accountRepository } from "../services/accountRepository";
import { pocketRepository } from "../services/pocketRepository";
import type { Account, MoneyState, Pocket } from "../domain/types";

export interface AccountWithPockets {
  account: Account;
  pockets: Pocket[];
  activePockets: Pocket[];
  pocketsTotal: number;
}

export interface MoneyStateTotals {
  available: number;
  reserved: number;
  protected: number;
  committed: number;
  total: number;
}

export function useAccountsData() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();

  const query = useQuery({
    queryKey: ["accounts", "data", workspace?.id],
    enabled: Boolean(user && workspace),
    queryFn: async () => {
      const userId = user!.id;
      const wsId = workspace!.id;
      const [accounts, pockets] = await Promise.all([
        accountRepository.listByWorkspace(userId, wsId),
        pocketRepository.listByWorkspace(userId, wsId),
      ]);
      return { accounts, pockets };
    },
  });

  const grouped: AccountWithPockets[] = useMemo(() => {
    if (!query.data) return [];
    const { accounts, pockets } = query.data;
    return accounts.map((account) => {
      const acctPockets = pockets.filter((p) => p.account_id === account.id);
      const active = acctPockets.filter((p) => p.is_active);
      return {
        account,
        pockets: acctPockets,
        activePockets: active,
        pocketsTotal: active.reduce((s, p) => s + Number(p.balance), 0),
      };
    });
  }, [query.data]);

  const totals: MoneyStateTotals = useMemo(() => {
    const t: MoneyStateTotals = {
      available: 0,
      reserved: 0,
      protected: 0,
      committed: 0,
      total: 0,
    };
    if (!query.data) return t;
    for (const p of query.data.pockets) {
      if (!p.is_active) continue;
      const acct = query.data.accounts.find((a) => a.id === p.account_id);
      if (!acct || !acct.is_active || !acct.include_in_total) continue;
      const key = p.money_state as MoneyState;
      t[key] += Number(p.balance);
      t.total += Number(p.balance);
    }
    return t;
  }, [query.data]);

  return {
    grouped,
    totals,
    isLoading: query.isPending,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
