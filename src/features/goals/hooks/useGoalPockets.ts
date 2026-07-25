/**
 * Lee todos los bolsillos activos del workspace y arma la vista de metas.
 * Un bolsillo cuenta como "meta" cuando tiene `target_amount` > 0.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { useWorkspace } from "@/features/identity/hooks/useWorkspace";
import { accountRepository } from "@/features/accounts/services/accountRepository";
import { pocketRepository } from "@/features/accounts/services/pocketRepository";
import type { Account, Pocket } from "@/features/accounts/domain/types";
import { buildGoalPocket, type GoalPocket } from "../domain/types";

export function useGoalPockets() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const enabled = Boolean(user && workspace);

  const query = useQuery({
    queryKey: ["goals", "pockets", workspace?.id],
    enabled,
    queryFn: async () => {
      const [accounts, pockets] = await Promise.all([
        accountRepository.listByWorkspace(user!.id, workspace!.id),
        pocketRepository.listByWorkspace(user!.id, workspace!.id),
      ]);
      return { accounts, pockets };
    },
  });

  const currency = useMemo(() => {
    const accts = query.data?.accounts ?? [];
    return (accts.find((a) => a.is_active) ?? accts[0])?.currency ?? "COP";
  }, [query.data]);

  const activePockets: Pocket[] = useMemo(
    () => (query.data?.pockets ?? []).filter((p) => p.is_active),
    [query.data],
  );

  const accountsById = useMemo(() => {
    const map = new Map<string, Account>();
    for (const a of query.data?.accounts ?? []) map.set(a.id, a);
    return map;
  }, [query.data]);

  const goals: GoalPocket[] = useMemo(() => {
    return activePockets
      .filter((p) => p.target_amount != null && Number(p.target_amount) > 0)
      .map((p) => {
        const acct = accountsById.get(p.account_id);
        return acct ? buildGoalPocket(p, acct) : null;
      })
      .filter((g): g is GoalPocket => g !== null)
      .sort((a, z) => z.rawProgressPct - a.rawProgressPct);
  }, [activePockets, accountsById]);

  const pocketsWithoutGoal: Pocket[] = useMemo(
    () =>
      activePockets.filter(
        (p) => p.target_amount == null || Number(p.target_amount) <= 0,
      ),
    [activePockets],
  );

  return {
    goals,
    pocketsWithoutGoal,
    activePockets,
    accountsById,
    currency,
    isLoading: query.isPending,
    isError: query.isError,
  };
}
