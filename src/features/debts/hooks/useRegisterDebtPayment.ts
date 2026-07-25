/**
 * Registro de un abono a deuda (LOVABLE-010 §12.2).
 *
 * Secuencia:
 *   1. Validar monto_total > 0, ≤ saldo del bolsillo; abono_capital > 0,
 *      ≤ monto_total y ≤ saldo pendiente de la deuda.
 *   2. Si hay category_id: buscar budget_item de esa categoría en el
 *      presupuesto activo (puede no existir — no es error).
 *   3. INSERT transactions (type='debt_payment', amount=monto_total, debt_id,
 *      + category_id/budget_item_id/affects_budget si aplica).
 *   4. UPDATE pockets.balance -= monto_total y accounts.current_balance -= monto_total.
 *   5. UPDATE debts.current_balance -= abono_capital;
 *      status='paid' si el nuevo saldo llega a 0.
 *   6. Si hay budget_item: reconciliar ejecución desde transactions.
 *
 * Invariante: accounts.current_balance = SUM(pockets.balance) tras el abono.
 * debts.current_balance nunca queda negativo (validado en el paso 1).
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { useWorkspace } from "@/features/identity/hooks/useWorkspace";
import { getSupabase } from "@/features/shared/services/supabaseClient";
import { pocketRepository } from "@/features/accounts/services/pocketRepository";
import { financialPeriodRepository } from "@/features/income/services/financialPeriodRepository";
import { budgetRepository } from "@/features/budget/services/budgetRepository";
import { budgetItemRepository } from "@/features/budget/services/budgetItemRepository";
import { debtRepository } from "../services/debtRepository";
import { debtTransactionRepository } from "../services/transactionRepository";

export interface RegisterDebtPaymentInput {
  debt_id: string;
  amount_total: number;
  amount_capital: number;
  date: string;
  description: string | null;
  account_id: string;
  pocket_id: string;
  category_id: string | null;
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

export function useRegisterDebtPayment() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: RegisterDebtPaymentInput) => {
      if (!user || !workspace) throw new Error("SESSION_NOT_READY");
      if (input.amount_total <= 0) throw new Error("TOTAL_MUST_BE_POSITIVE");
      if (input.amount_capital <= 0)
        throw new Error("CAPITAL_MUST_BE_POSITIVE");
      if (input.amount_capital > input.amount_total)
        throw new Error("CAPITAL_EXCEEDS_TOTAL");

      // Releer saldo del bolsillo y saldo de la deuda (defensa en profundidad).
      const [pocketBalance, debt] = await Promise.all([
        fetchPocketBalance(input.pocket_id),
        debtRepository.getById(input.debt_id),
      ]);
      if (!debt) throw new Error("DEBT_NOT_FOUND");
      if (input.amount_total > pocketBalance)
        throw new Error("TOTAL_EXCEEDS_POCKET");
      const currentDebt = Number(debt.current_balance);
      if (input.amount_capital > currentDebt)
        throw new Error("CAPITAL_EXCEEDS_DEBT");

      const period = await financialPeriodRepository.getActive(
        user.id,
        workspace.id,
      );

      // 2. Buscar budget_item si hay categoría y período activo.
      let budgetItem = null as Awaited<
        ReturnType<typeof budgetItemRepository.findByCategory>
      >;
      if (input.category_id && period) {
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
      await debtTransactionRepository.createDebtPayment({
        user_id: user.id,
        workspace_id: workspace.id,
        amount: input.amount_total,
        date: input.date,
        description: input.description?.trim() ? input.description.trim() : null,
        account_id: input.account_id,
        pocket_id: input.pocket_id,
        debt_id: input.debt_id,
        financial_period_id: period?.id ?? null,
        category_id: input.category_id,
        budget_item_id: budgetItem?.id ?? null,
        affects_budget: Boolean(budgetItem),
      });

      // 4. UPDATE bolsillo y cuenta por monto_total.
      await pocketRepository.setBalance(
        input.pocket_id,
        pocketBalance - input.amount_total,
      );
      const acctBal = await fetchAccountBalance(input.account_id);
      const { error: acctErr } = await getSupabase()
        .from("accounts")
        .update({ current_balance: acctBal - input.amount_total })
        .eq("id", input.account_id);
      if (acctErr) throw acctErr;

      // 5. UPDATE deuda por abono_capital, marcar 'paid' si llega a 0.
      const newDebt = Math.max(0, currentDebt - input.amount_capital);
      const newStatus = newDebt <= 0 ? "paid" : "active";
      await debtRepository.setBalanceAndStatus(
        input.debt_id,
        newDebt,
        newStatus,
      );

      // 6. Ejecución de presupuesto si aplica (monto total pagado).
      if (budgetItem) {
        await budgetItemRepository.refreshExecutionForTransaction({
          budget_item_id: budgetItem.id,
          category_id: input.category_id,
          affects_budget: true,
        });
      }

      return {
        paid: newStatus === "paid",
        linkedToBudget: Boolean(budgetItem),
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["debts"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["movements"] });
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["income"] });
      qc.invalidateQueries({ queryKey: ["budget"] });
    },
  });
}
