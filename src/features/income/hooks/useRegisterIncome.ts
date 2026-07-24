/**
 * Registro de un ingreso real (Sección 12.1 de LOVABLE-004).
 *
 * Secuencia:
 *   1. Resolver income_source (primaria existente, o findByNameOrCreate).
 *   2. INSERT transactions (type='income') → devuelve transaction_id.
 *   3. INSERT period_incomes (income_source_id + transaction_id).
 *   4. UPDATE pockets.balance += X.
 *   5. UPDATE accounts.current_balance += X.
 *   6. UPDATE financial_periods.total_income_received += X.
 *
 * Invariante que mantiene: accounts.current_balance == Σ pockets.balance
 * (mismo bolsillo y cuenta suben en el mismo monto).
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { useWorkspace } from "@/features/identity/hooks/useWorkspace";
import { incomeSourceRepository } from "../services/incomeSourceRepository";
import { transactionRepository } from "../services/transactionRepository";
import { periodIncomeRepository } from "../services/periodIncomeRepository";
import { financialPeriodRepository } from "../services/financialPeriodRepository";
import { accountRepository } from "@/features/accounts/services/accountRepository";
import { pocketRepository } from "@/features/accounts/services/pocketRepository";
import { getSupabase } from "@/features/shared/services/supabaseClient";
import type { ActivePeriod, IncomeSourceType } from "../domain/types";

export type RegisterIncomeInput =
  | {
      kind: "primary";
      amount: number;
      date: string;
      account_id: string;
      pocket_id: string;
      period: ActivePeriod;
    }
  | {
      kind: "other";
      name: string;
      source_type: IncomeSourceType;
      amount: number;
      date: string;
      account_id: string;
      pocket_id: string;
      period: ActivePeriod;
    };

async function fetchPocketBalance(pocketId: string): Promise<number> {
  const { data, error } = await getSupabase()
    .from("pockets")
    .select("balance")
    .eq("id", pocketId)
    .single();
  if (error) throw error;
  return Number((data as { balance: number }).balance);
}

async function fetchAccountBalance(accountId: string): Promise<number> {
  const { data, error } = await getSupabase()
    .from("accounts")
    .select("current_balance")
    .eq("id", accountId)
    .single();
  if (error) throw error;
  return Number((data as { current_balance: number }).current_balance);
}

export function useRegisterIncome() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: RegisterIncomeInput) => {
      if (!user || !workspace) throw new Error("SESSION_NOT_READY");
      if (input.amount <= 0) throw new Error("AMOUNT_MUST_BE_POSITIVE");

      const userId = user.id;
      const workspaceId = workspace.id;

      // 1. Fuente
      let sourceId: string;
      let expected = 0;
      if (input.kind === "primary") {
        const primary = await incomeSourceRepository.getPrimary(
          userId,
          workspaceId,
        );
        if (!primary) throw new Error("PRIMARY_SOURCE_MISSING");
        sourceId = primary.id;
        expected = Number(primary.expected_amount);
      } else {
        if (!input.name.trim()) throw new Error("SOURCE_NAME_REQUIRED");
        const src = await incomeSourceRepository.findByNameOrCreate({
          user_id: userId,
          workspace_id: workspaceId,
          name: input.name,
          source_type: input.source_type,
        });
        sourceId = src.id;
        expected = Number(src.expected_amount);
      }

      // 2. transactions
      const tx = await transactionRepository.createIncome({
        user_id: userId,
        workspace_id: workspaceId,
        amount: input.amount,
        date: input.date,
        account_id: input.account_id,
        pocket_id: input.pocket_id,
        financial_period_id: input.period.id,
      });

      // 3. period_incomes
      await periodIncomeRepository.create({
        user_id: userId,
        workspace_id: workspaceId,
        financial_period_id: input.period.id,
        income_source_id: sourceId,
        transaction_id: tx.id,
        amount_received: input.amount,
        received_date: input.date,
        variance_amount: input.amount - expected,
        notes: null,
      });

      // 4. pocket balance += X
      const pocketBal = await fetchPocketBalance(input.pocket_id);
      await pocketRepository.setBalance(
        input.pocket_id,
        pocketBal + input.amount,
      );

      // 5. account current_balance += X (mantiene invariante Σ pockets)
      const acctBal = await fetchAccountBalance(input.account_id);
      const { error: acctErr } = await getSupabase()
        .from("accounts")
        .update({ current_balance: acctBal + input.amount })
        .eq("id", input.account_id);
      if (acctErr) throw acctErr;

      // 6. financial_periods.total_income_received += X
      const newTotal =
        Number(input.period.total_income_received) + input.amount;
      await financialPeriodRepository.setTotalIncomeReceived(
        input.period.id,
        newTotal,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["income"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
