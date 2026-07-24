/**
 * Mutaciones del feature Cuentas & Bolsillos (LOVABLE-003).
 *
 * Reglas invariantes (Sección 12):
 * - Toda cuenta nueva nace con un bolsillo 'General' (accounts.current_balance == pocket General.balance).
 * - Bolsillos adicionales se financian con `transfer` desde General, nunca con `opening_balance`.
 * - accounts.current_balance == SUM(pockets.balance de bolsillos activos de esa cuenta).
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { useWorkspace } from "@/features/identity/hooks/useWorkspace";
import { accountRepository } from "../services/accountRepository";
import { pocketRepository } from "../services/pocketRepository";
import { transactionRepository } from "../services/transactionRepository";
import { financialPeriodRepository } from "@/features/onboarding/services/financialPeriodRepository";
import { toISODate } from "@/features/onboarding/domain/types";
import {
  GENERAL_POCKET_NAME,
  type AccountType,
  type MoneyState,
} from "../domain/types";

function todayISO() {
  return toISODate(new Date());
}

function useIds() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  return { userId: user?.id ?? null, workspaceId: workspace?.id ?? null };
}

function invalidateAccounts(qc: ReturnType<typeof useQueryClient>) {
  return qc.invalidateQueries({ queryKey: ["accounts"] });
}

export function useCreateAccount() {
  const { userId, workspaceId } = useIds();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      type: AccountType;
      currency: string;
      opening_balance: number;
      include_in_total: boolean;
    }) => {
      if (!userId || !workspaceId) throw new Error("SESSION_NOT_READY");
      const account = await accountRepository.create({
        user_id: userId,
        workspace_id: workspaceId,
        ...input,
      });
      const general = await pocketRepository.create({
        account_id: account.id,
        user_id: userId,
        workspace_id: workspaceId,
        name: GENERAL_POCKET_NAME,
        money_state: "available",
        balance: input.opening_balance,
      });
      if (input.opening_balance > 0) {
        await transactionRepository.createOpeningBalance({
          user_id: userId,
          workspace_id: workspaceId,
          amount: input.opening_balance,
          date: todayISO(),
          account_id: account.id,
          pocket_id: general.id,
        });
      }
      return account;
    },
    onSuccess: () => invalidateAccounts(qc),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      name: string;
      type: AccountType;
      currency: string;
      include_in_total: boolean;
    }) => {
      const { id, ...patch } = input;
      return accountRepository.update(id, patch);
    },
    onSuccess: () => invalidateAccounts(qc),
  });
}

export function useDeactivateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => accountRepository.deactivate(id),
    onSuccess: () => invalidateAccounts(qc),
  });
}

export function useCreatePocket() {
  const { userId, workspaceId } = useIds();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      account_id: string;
      name: string;
      money_state: MoneyState;
      /** Monto a transferir desde General. 0 = crear vacío. */
      amount_from_general: number;
    }) => {
      if (!userId || !workspaceId) throw new Error("SESSION_NOT_READY");

      // 1. Consultar General y validar el monto (defensa en profundidad; UI lo bloquea antes).
      const general = await pocketRepository.getGeneralByAccount(
        input.account_id,
      );
      if (!general) throw new Error("GENERAL_POCKET_MISSING");
      const generalBalance = Number(general.balance);
      if (input.amount_from_general < 0) {
        throw new Error("AMOUNT_NEGATIVE");
      }
      if (input.amount_from_general > generalBalance) {
        throw new Error("AMOUNT_EXCEEDS_GENERAL");
      }

      // 2. Crear bolsillo nuevo con balance=0.
      const pocket = await pocketRepository.create({
        account_id: input.account_id,
        user_id: userId,
        workspace_id: workspaceId,
        name: input.name,
        money_state: input.money_state,
        balance: 0,
      });

      // 3. Si hay monto > 0: transferencia interna + ajuste de balances.
      if (input.amount_from_general > 0) {
        const period = await financialPeriodRepository.getActive(
          userId,
          workspaceId,
        );
        await transactionRepository.createInternalTransfer({
          user_id: userId,
          workspace_id: workspaceId,
          amount: input.amount_from_general,
          date: todayISO(),
          account_id: input.account_id,
          pocket_id: general.id,
          to_account_id: input.account_id,
          to_pocket_id: pocket.id,
          financial_period_id: period?.id ?? null,
        });
        await pocketRepository.setBalance(
          general.id,
          generalBalance - input.amount_from_general,
        );
        await pocketRepository.setBalance(pocket.id, input.amount_from_general);
      }

      return pocket;
    },
    onSuccess: () => invalidateAccounts(qc),
  });
}

export function useUpdatePocket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      name: string;
      money_state: MoneyState;
    }) => {
      const { id, ...patch } = input;
      return pocketRepository.update(id, patch);
    },
    onSuccess: () => invalidateAccounts(qc),
  });
}

export function useDeactivatePocket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; balance: number; isGeneral: boolean }) => {
      if (input.isGeneral) throw new Error("CANNOT_DEACTIVATE_GENERAL");
      if (input.balance > 0) throw new Error("POCKET_HAS_BALANCE");
      await pocketRepository.deactivate(input.id);
    },
    onSuccess: () => invalidateAccounts(qc),
  });
}
