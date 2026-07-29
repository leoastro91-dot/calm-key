/**
 * Registrar un préstamo a un tercero (LOVABLE-012 §12.1).
 *
 * Secuencia:
 *   1. Validar monto > 0, monto <= balance del bolsillo origen, deudor no vacío.
 *   2. INSERT loans (status='active').
 *   3. INSERT transactions (type='loan_given', affects_budget=false).
 *   4. UPDATE pockets.balance -= monto.
 *   5. UPDATE accounts.current_balance -= monto.
 *
 * Modo retroactivo (§12.3): el dinero ya salió en la realidad antes de existir
 * este módulo, pero la app nunca lo registró. Se crea sólo la fila en loans
 * (pasos 3-5 omitidos) para no descuadrar el saldo del bolsillo.
 *
 * Invariante: accounts.current_balance = SUM(pockets.balance).
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { useWorkspace } from "@/features/identity/hooks/useWorkspace";
import { getSupabase } from "@/features/shared/services/supabaseClient";
import { pocketRepository } from "@/features/accounts/services/pocketRepository";
import { financialPeriodRepository } from "@/features/income/services/financialPeriodRepository";
import { loanRepository } from "../services/loanRepository";
import { loanTransactionRepository } from "../services/transactionRepository";

export interface CreateLoanInput {
  borrower_name: string;
  amount: number;
  account_id: string;
  pocket_id: string;
  date_given: string;
  expected_return_date: string | null;
  has_interest: boolean;
  interest_amount: number | null;
  notes: string | null;
  /** true = préstamo histórico: no mueve saldos ni crea transacción. */
  retroactive: boolean;
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

export function useCreateLoan() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLoanInput) => {
      if (!user || !workspace) throw new Error("SESSION_NOT_READY");
      if (!input.borrower_name.trim()) throw new Error("BORROWER_REQUIRED");
      if (input.amount <= 0) throw new Error("AMOUNT_MUST_BE_POSITIVE");
      if (!input.pocket_id) throw new Error("POCKET_REQUIRED");

      const pocketBalance = await fetchPocketBalance(input.pocket_id);
      if (!input.retroactive && input.amount > pocketBalance) {
        throw new Error("AMOUNT_EXCEEDS_POCKET");
      }

      const loan = await loanRepository.create({
        user_id: user.id,
        workspace_id: workspace.id,
        pocket_id: input.pocket_id,
        borrower_name: input.borrower_name.trim(),
        amount: input.amount,
        has_interest: input.has_interest,
        interest_amount: input.has_interest ? input.interest_amount : null,
        date_given: input.date_given,
        expected_return_date: input.expected_return_date,
        notes: input.notes?.trim() ? input.notes.trim() : null,
      });

      if (input.retroactive) return loan;

      const period = await financialPeriodRepository.getActive(
        user.id,
        workspace.id,
      );

      await loanTransactionRepository.createLoanGiven({
        user_id: user.id,
        workspace_id: workspace.id,
        amount: input.amount,
        date: input.date_given,
        description: `Préstamo a ${input.borrower_name.trim()}`,
        account_id: input.account_id,
        pocket_id: input.pocket_id,
        loan_id: loan.id,
        financial_period_id: period?.id ?? null,
      });

      await pocketRepository.setBalance(
        input.pocket_id,
        pocketBalance - input.amount,
      );

      const acctBal = await fetchAccountBalance(input.account_id);
      const { data, error } = await getSupabase()
        .from("accounts")
        .update({ current_balance: acctBal - input.amount })
        .eq("id", input.account_id)
        .select("id");
      if (error) throw error;
      if (!data?.length) throw new Error("ACCOUNT_BALANCE_UPDATE_FAILED");

      return loan;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loans"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["movements"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
