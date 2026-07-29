/** Préstamos del workspace + catálogo de cuentas/bolsillos para los formularios. */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { useWorkspace } from "@/features/identity/hooks/useWorkspace";
import { accountRepository } from "@/features/accounts/services/accountRepository";
import { pocketRepository } from "@/features/accounts/services/pocketRepository";
import { loanRepository } from "../services/loanRepository";
import type { Loan } from "../domain/types";

export function useLoans() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();

  const loansQ = useQuery({
    queryKey: ["loans", "list", workspace?.id],
    enabled: Boolean(user && workspace),
    queryFn: () => loanRepository.listByWorkspace(user!.id, workspace!.id),
  });

  const catalogQ = useQuery({
    queryKey: ["loans", "catalog", workspace?.id],
    enabled: Boolean(user && workspace),
    queryFn: async () => {
      const [accounts, pockets] = await Promise.all([
        accountRepository.listByWorkspace(user!.id, workspace!.id),
        pocketRepository.listByWorkspace(user!.id, workspace!.id),
      ]);
      return { accounts, pockets };
    },
  });

  const loans: Loan[] = loansQ.data ?? [];
  const activeLoans = useMemo(
    () => loans.filter((l) => l.status === "active"),
    [loans],
  );
  const paidLoans = useMemo(
    () => loans.filter((l) => l.status === "paid"),
    [loans],
  );

  return {
    loans,
    activeLoans,
    paidLoans,
    accounts: catalogQ.data?.accounts ?? [],
    pockets: catalogQ.data?.pockets ?? [],
    isLoading: loansQ.isLoading || catalogQ.isLoading,
    isError: loansQ.isError || catalogQ.isError,
    refetch: () => {
      loansQ.refetch();
      catalogQ.refetch();
    },
  };
}
