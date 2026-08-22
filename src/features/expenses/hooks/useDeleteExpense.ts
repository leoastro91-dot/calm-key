/**
 * Reversa de un gasto ya registrado.
 *
 * Secuencia (inversa a useRegisterExpense):
 *   1. DELETE transactions (el gasto).
 *   2. pockets.balance += monto  y  accounts.current_balance += monto.
 *   3. Si el gasto estaba ligado a una línea de presupuesto, reconciliar
 *      su ejecución desde transactions (RN-05: actual_amount es derivado).
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/features/shared/services/supabaseClient";
import { pocketRepository } from "@/features/accounts/services/pocketRepository";
import { budgetItemRepository } from "@/features/budget/services/budgetItemRepository";
import { expenseTransactionRepository } from "../services/transactionRepository";
import type { ExpenseRow } from "../domain/types";

async function fetchPocketBalance(id: string): Promise<number> {
  const { data, error } = await getSupabase()
    .from("pockets")
    .select("balance")
    .eq("id", id)
    .single();
  if (error) throw error;
  return Number((data as { balance: number }).balance);
}

async function fetchAccountBalance(id: string): Promise<number> {
  const { data, error } = await getSupabase()
    .from("accounts")
    .select("current_balance")
    .eq("id", id)
    .single();
  if (error) throw error;
  return Number((data as { current_balance: number }).current_balance);
}

export function useDeleteExpense() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (expense: ExpenseRow) => {
      const amount = Number(expense.amount);
      if (!(amount > 0)) throw new Error("AMOUNT_INVALID");

      // 1. Borrar la transacción.
      await expenseTransactionRepository.remove(expense.id);

      // 2. Devolver el dinero al bolsillo y a la cuenta.
      const pocketBal = await fetchPocketBalance(expense.pocket_id);
      await pocketRepository.setBalance(expense.pocket_id, pocketBal + amount);

      const acctBal = await fetchAccountBalance(expense.account_id);
      const { error: acctErr } = await getSupabase()
        .from("accounts")
        .update({ current_balance: acctBal + amount })
        .eq("id", expense.account_id);
      if (acctErr) throw acctErr;

      // 3. Reconciliar ejecución presupuestal si aplicaba.
      if (expense.affects_budget && expense.budget_item_id) {
        await budgetItemRepository.refreshExecutionForTransaction({
          budget_item_id: expense.budget_item_id,
          category_id: expense.category_id,
          affects_budget: true,
        });
      }

      return { id: expense.id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["budget"] });
      qc.invalidateQueries({ queryKey: ["movements"] });
      qc.invalidateQueries({ queryKey: ["income"] });
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
