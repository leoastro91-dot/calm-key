/**
 * Datos combinados de la pantalla /ingresos: período activo + ingresos
 * registrados + fuentes disponibles + cuentas/bolsillos para los dropdowns.
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { useWorkspace } from "@/features/identity/hooks/useWorkspace";
import { financialPeriodRepository } from "../services/financialPeriodRepository";
import { periodIncomeRepository } from "../services/periodIncomeRepository";
import { incomeSourceRepository } from "../services/incomeSourceRepository";
import { accountRepository } from "@/features/accounts/services/accountRepository";
import { pocketRepository } from "@/features/accounts/services/pocketRepository";

export function useActivePeriod() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: ["income", "active-period", workspace?.id],
    enabled: Boolean(user && workspace),
    queryFn: () =>
      financialPeriodRepository.getActive(user!.id, workspace!.id),
  });
}

export function usePeriodIncomes(financialPeriodId: string | null | undefined) {
  return useQuery({
    queryKey: ["income", "list", financialPeriodId],
    enabled: Boolean(financialPeriodId),
    queryFn: () => periodIncomeRepository.listByPeriod(financialPeriodId!),
  });
}

export function useIncomeSources() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: ["income", "sources", workspace?.id],
    enabled: Boolean(user && workspace),
    queryFn: () =>
      incomeSourceRepository.listByWorkspace(user!.id, workspace!.id),
  });
}

export function useAccountsAndPockets() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: ["income", "destinations", workspace?.id],
    enabled: Boolean(user && workspace),
    queryFn: async () => {
      const [accounts, pockets] = await Promise.all([
        accountRepository.listByWorkspace(user!.id, workspace!.id),
        pocketRepository.listByWorkspace(user!.id, workspace!.id),
      ]);
      return {
        accounts: accounts.filter((a) => a.is_active),
        pockets: pockets.filter((p) => p.is_active),
      };
    },
  });
}
