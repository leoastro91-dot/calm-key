/**
 * Traslado interno entre dos bolsillos del mismo usuario (LOVABLE-005 §12.1,
 * v1.1). Ahora acepta category_id opcional — si se elige, el traslado
 * cuenta como ejecución de esa línea del presupuesto activo (§12 v1.1).
 *
 * Secuencia:
 *   1. Validar monto > 0 y monto <= balance actual del bolsillo origen.
 *   2. type = 'emergency_use' si el bolsillo origen es 'protected', si no 'transfer'.
 *   3. Si hay categoría: buscar budget_item en el presupuesto activo (puede no existir).
 *   4. INSERT transactions con to_account_id/to_pocket_id (+ category_id/affects_budget/budget_item_id).
 *   5. UPDATE pockets: origen -= X, destino += X.
 *   6. SI cambia de cuenta: UPDATE accounts.current_balance en ambos.
 *   7. SI hay budget_item: reconciliar actual_amount/current_execution_pct/overspend desde transactions.
 *
 * Invariante: accounts.current_balance = Σ pockets.balance en origen y destino.
 * Patrimonio total nunca cambia (RInt-03).
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { useWorkspace } from "@/features/identity/hooks/useWorkspace";
import { pocketRepository } from "@/features/accounts/services/pocketRepository";
import { accountRepository } from "@/features/accounts/services/accountRepository";
import { financialPeriodRepository } from "@/features/onboarding/services/financialPeriodRepository";
import { budgetRepository } from "@/features/budget/services/budgetRepository";
import { budgetItemRepository } from "@/features/budget/services/budgetItemRepository";
import { getSupabase } from "@/features/shared/services/supabaseClient";
import { transferTransactionRepository } from "../services/transactionRepository";

export interface TransferInput {
  amount: number;
  date: string;
  description: string | null;
  from_account_id: string;
  from_pocket_id: string;
  to_account_id: string;
  to_pocket_id: string;
  category_id: string | null;
}

async function fetchPocket(id: string) {
  const { data, error } = await getSupabase()
    .from("pockets")
    .select("id, balance, money_state, account_id")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as {
    id: string;
    balance: number;
    money_state: string;
    account_id: string;
  };
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

export function useTransferMoney() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: TransferInput) => {
      if (!user || !workspace) throw new Error("SESSION_NOT_READY");
      if (input.amount <= 0) throw new Error("AMOUNT_MUST_BE_POSITIVE");
      if (input.from_pocket_id === input.to_pocket_id) {
        throw new Error("SAME_POCKET");
      }

      // 1. Releer bolsillo origen (defensa en profundidad).
      const source = await fetchPocket(input.from_pocket_id);
      const sourceBalance = Number(source.balance);
      if (input.amount > sourceBalance) throw new Error("AMOUNT_EXCEEDS_SOURCE");

      // 2. Tipo según estado del bolsillo origen.
      const type: "transfer" | "emergency_use" =
        source.money_state === "protected" ? "emergency_use" : "transfer";

      // 3. Período activo (si existe) + budget_item si hay categoría.
      const period = await financialPeriodRepository.getActive(
        user.id,
        workspace.id,
      );
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

      // 4. INSERT transaction.
      await transferTransactionRepository.create({
        user_id: user.id,
        workspace_id: workspace.id,
        type,
        amount: input.amount,
        date: input.date,
        description: input.description?.trim() ? input.description.trim() : null,
        account_id: input.from_account_id,
        pocket_id: input.from_pocket_id,
        to_account_id: input.to_account_id,
        to_pocket_id: input.to_pocket_id,
        financial_period_id: period?.id ?? null,
        category_id: input.category_id,
        budget_item_id: budgetItem?.id ?? null,
        affects_budget: Boolean(input.category_id),
      });

      // 5. UPDATE bolsillos.
      const dest = await fetchPocket(input.to_pocket_id);
      await pocketRepository.setBalance(
        input.from_pocket_id,
        sourceBalance - input.amount,
      );
      await pocketRepository.setBalance(
        input.to_pocket_id,
        Number(dest.balance) + input.amount,
      );

      // 6. UPDATE cuentas SI son distintas.
      if (input.from_account_id !== input.to_account_id) {
        const fromBal = await fetchAccountBalance(input.from_account_id);
        const toBal = await fetchAccountBalance(input.to_account_id);
        const { error: e1 } = await getSupabase()
          .from("accounts")
          .update({ current_balance: fromBal - input.amount })
          .eq("id", input.from_account_id);
        if (e1) throw e1;
        const { error: e2 } = await getSupabase()
          .from("accounts")
          .update({ current_balance: toBal + input.amount })
          .eq("id", input.to_account_id);
        if (e2) throw e2;
      }

      // 7. Ejecución del presupuesto si aplica.
      //    La ejecución se deriva de transactions categorizadas con
      //    affects_budget=true, sin distinguir type.
      if (budgetItem) {
        await budgetItemRepository.refreshExecutionForTransaction({
          budget_item_id: budgetItem.id,
          category_id: input.category_id,
          affects_budget: true,
        });
      }

      // Silenciar warning de linter (accountRepository importado como fuente
      // canónica de operaciones sobre cuentas — reutilizable a futuro).
      void accountRepository;

      return { type, linkedToBudget: Boolean(budgetItem) };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["movements"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["income"] });
      qc.invalidateQueries({ queryKey: ["budget"] });
    },
  });
}
