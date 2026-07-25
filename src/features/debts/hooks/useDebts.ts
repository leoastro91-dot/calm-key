/**
 * Carga la lista de deudas del workspace y el catálogo de cuentas/bolsillos
 * necesario para el formulario de abonos y el historial.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { useWorkspace } from "@/features/identity/hooks/useWorkspace";
import { accountRepository } from "@/features/accounts/services/accountRepository";
import { pocketRepository } from "@/features/accounts/services/pocketRepository";
import { debtRepository } from "../services/debtRepository";
import type { Debt } from "../domain/types";

export function useDebts() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();

  const debtsQ = useQuery({
    queryKey: ["debts", "list", workspace?.id],
    enabled: Boolean(user && workspace),
    queryFn: () => debtRepository.listByWorkspace(user!.id, workspace!.id),
  });

  const catalogQ = useQuery({
    queryKey: ["debts", "catalog", workspace?.id],
    enabled: Boolean(user && workspace),
    queryFn: async () => {
      const [accounts, pockets] = await Promise.all([
        accountRepository.listByWorkspace(user!.id, workspace!.id),
        pocketRepository.listByWorkspace(user!.id, workspace!.id),
      ]);
      return { accounts, pockets };
    },
  });

  const debts: Debt[] = debtsQ.data ?? [];
  const accounts = catalogQ.data?.accounts ?? [];
  const pockets = catalogQ.data?.pockets ?? [];

  const activeDebts = useMemo(
    () => debts.filter((d) => d.status !== "paid"),
    [debts],
  );
  const paidDebts = useMemo(
    () => debts.filter((d) => d.status === "paid"),
    [debts],
  );

  return {
    debts,
    activeDebts,
    paidDebts,
    accounts,
    pockets,
    isLoading: debtsQ.isLoading || catalogQ.isLoading,
    isError: debtsQ.isError || catalogQ.isError,
    refetch: () => {
      debtsQ.refetch();
      catalogQ.refetch();
    },
  };
}
