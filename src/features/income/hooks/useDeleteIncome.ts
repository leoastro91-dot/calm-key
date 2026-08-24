/**
 * Reversa de un ingreso ya registrado (inversa de useRegisterIncome).
 *
 * Secuencia:
 *   1. DELETE period_incomes.
 *   2. DELETE transactions.
 *   3. pockets.balance -= monto  y  accounts.current_balance -= monto.
 *   4. financial_periods.total_income_received -= monto.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/features/shared/services/supabaseClient";
import { pocketRepository } from "@/features/accounts/services/pocketRepository";
import { financialPeriodRepository } from "../services/financialPeriodRepository";
import { removePeriodIncome } from "../services/periodIncomeRepository";
import { removeIncomeTransaction } from "../services/transactionRepository";
import type { ActivePeriod } from "../domain/types";

async function fetchTxDestination(
  transactionId: string,
): Promise<{ account_id: string; pocket_id: string } | null> {
  const { data, error } = await getSupabase()
    .from("transactions")
    .select("account_id, pocket_id")
    .eq("id", transactionId)
    .maybeSingle();
  if (error) throw error;
  return (data as { account_id: string; pocket_id: string }) ?? null;
}

export interface DeleteIncomeInput {
  period_income_id: string;
  transaction_id: string;
  amount: number;
  period: ActivePeriod;
}

export function useDeleteIncome() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeleteIncomeInput) => {
      const amount = Number(input.amount);
      if (!(amount > 0)) throw new Error("AMOUNT_INVALID");

      const dest = await fetchTxDestination(input.transaction_id);

      await removePeriodIncome(input.period_income_id);
      await removeIncomeTransaction(input.transaction_id);

      if (dest) {
        const { data: pk, error: pkErr } = await getSupabase()
          .from("pockets")
          .select("balance")
          .eq("id", dest.pocket_id)
          .single();
        if (pkErr) throw pkErr;
        await pocketRepository.setBalance(
          dest.pocket_id,
          Number((pk as { balance: number }).balance) - amount,
        );

        const { data: acc, error: accErr } = await getSupabase()
          .from("accounts")
          .select("current_balance")
          .eq("id", dest.account_id)
          .single();
        if (accErr) throw accErr;
        const { error: updErr } = await getSupabase()
          .from("accounts")
          .update({
            current_balance:
              Number((acc as { current_balance: number }).current_balance) -
              amount,
          })
          .eq("id", dest.account_id);
        if (updErr) throw updErr;
      }

      const nextTotal = Math.max(
        0,
        Number(input.period.total_income_received) - amount,
      );
      await financialPeriodRepository.setTotalIncomeReceived(
        input.period.id,
        nextTotal,
      );

      return { id: input.period_income_id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["income"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["budget"] });
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["movements"] });
    },
  });
}
