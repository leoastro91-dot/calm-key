/**
 * Registro de un gasto real (LOVABLE-007 §12.1).
 *
 * Secuencia:
 *   1. Validar monto > 0, categoría obligatoria, monto <= saldo del bolsillo.
 *   2. Buscar budget_item de la categoría en el presupuesto activo (puede no existir).
 *   3. INSERT transactions (type='expense', affects_budget=true, budget_item_id).
 *   4. UPDATE pockets.balance -= X y accounts.current_balance -= X.
 *   5. SI existe budget_item: reconciliar ejecución desde transactions.
 *
 * Invariante: accounts.current_balance = Σ pockets.balance en la cuenta afectada.
 * RN-05: budget_items.actual_amount se deriva de transactions affects_budget=true.
 * RP-06: nunca se bloquea un gasto por superar el presupuesto.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { useWorkspace } from "@/features/identity/hooks/useWorkspace";
import { getSupabase } from "@/features/shared/services/supabaseClient";
import { pocketRepository } from "@/features/accounts/services/pocketRepository";
import { financialPeriodRepository } from "@/features/income/services/financialPeriodRepository";
import { budgetRepository } from "@/features/budget/services/budgetRepository";
import { budgetItemRepository } from "@/features/budget/services/budgetItemRepository";
import { expenseTransactionRepository } from "../services/transactionRepository";
import type { SpendingNature } from "../domain/types";

export interface RegisterExpenseInput {
  amount: number;
  date: string;
  description: string | null;
  event_tag: string | null;
  account_id: string;
  pocket_id: string;
  category_id: string;
  subcategory_id: string | null;
  spending_nature: SpendingNature;
  /** true = consume presupuesto del período; false = uso de fondo acumulado. */
  affects_budget: boolean;
}

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

export function useRegisterExpense() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: RegisterExpenseInput) => {
      if (!user || !workspace) throw new Error("SESSION_NOT_READY");
      if (input.amount <= 0) throw new Error("AMOUNT_MUST_BE_POSITIVE");
      if (!input.category_id) throw new Error("CATEGORY_REQUIRED");

      // 1. Releer saldo del bolsillo origen (defensa en profundidad).
      const sourceBalance = await fetchPocketBalance(input.pocket_id);
      if (input.amount > sourceBalance) throw new Error("AMOUNT_EXCEEDS_SOURCE");

      // 2. Período activo + budget del período (si existen).
      const period = await financialPeriodRepository.getActive(
        user.id,
        workspace.id,
      );
      let budgetItem = null as Awaited<
        ReturnType<typeof budgetItemRepository.findByCategory>
      >;
      // Sólo tocamos presupuesto cuando el gasto se financia con el ciclo.
      if (period && input.affects_budget) {
        const budget = await budgetRepository.getOrCreateForActivePeriod({
          user_id: user.id,
          workspace_id: workspace.id,
          financial_period_id: period.id,
        });
        budgetItem = await budgetItemRepository.findByCategory(
          budget.id,
          input.category_id,
        );
      }

      // 3. INSERT transaction.
      await expenseTransactionRepository.createExpense({
        user_id: user.id,
        workspace_id: workspace.id,
        amount: input.amount,
        date: input.date,
        description: input.description?.trim() ? input.description.trim() : null,
        event_tag: input.event_tag?.trim() ? input.event_tag.trim() : null,
        account_id: input.account_id,
        pocket_id: input.pocket_id,
        category_id: input.category_id,
        subcategory_id: input.subcategory_id,
        financial_period_id: period?.id ?? null,
        spending_nature: input.spending_nature,
        budget_item_id: budgetItem?.id ?? null,
      });

      // 4. UPDATE bolsillo y cuenta.
      await pocketRepository.setBalance(
        input.pocket_id,
        sourceBalance - input.amount,
      );
      const acctBal = await fetchAccountBalance(input.account_id);
      const { error: acctErr } = await getSupabase()
        .from("accounts")
        .update({ current_balance: acctBal - input.amount })
        .eq("id", input.account_id);
      if (acctErr) throw acctErr;

      // 5. Reconciliar ejecución si hay línea de presupuesto.
      if (budgetItem) {
        await budgetItemRepository.refreshExecutionForTransaction({
          budget_item_id: budgetItem.id,
          category_id: input.category_id,
          affects_budget: true,
        });
      }

      return { linkedToBudget: Boolean(budgetItem) };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["budget"] });
      qc.invalidateQueries({ queryKey: ["movements"] });
      qc.invalidateQueries({ queryKey: ["income"] });
    },
  });
}
