/**
 * Registrar la devolución completa de un préstamo (LOVABLE-012 §12.2).
 *
 * Secuencia:
 *   1. Validar monto > 0 y que el préstamo siga 'active'.
 *   2. INSERT transactions (type='loan_repayment', affects_budget=false).
 *   3. UPDATE pockets.balance += monto (bolsillo destino).
 *   4. UPDATE accounts.current_balance += monto (cuenta destino).
 *   5. UPDATE loans → status='paid', date_repaid.
 *
 * Sin devoluciones parciales ni desagregado capital/interés (KISS, §5).
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { useWorkspace } from "@/features/identity/hooks/useWorkspace";
import { getSupabase } from "@/features/shared/services/supabaseClient";
import { pocketRepository } from "@/features/accounts/services/pocketRepository";
import { financialPeriodRepository } from "@/features/income/services/financialPeriodRepository";
import { loanRepository } from "../services/loanRepository";
import { loanTransactionRepository } from "../services/transactionRepository";

export interface RegisterLoanRepaymentInput {
  loan_id: string;
  amount: number;
  date: string;
  account_id: string;
  pocket_id: string;
}

export function useRegisterLoanRepayment() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: RegisterLoanRepaymentInput) => {
      if (!user || !workspace) throw new Error("SESSION_NOT_READY");
      if (input.amount <= 0) throw new Error("AMOUNT_MUST_BE_POSITIVE");
      if (!input.pocket_id) throw new Error("POCKET_REQUIRED");

      const loan = await loanRepository.getById(input.loan_id);
      if (!loan) throw new Error("LOAN_NOT_FOUND");
      if (loan.status !== "active") throw new Error("LOAN_ALREADY_PAID");

      const period = await financialPeriodRepository.getActive(
        user.id,
        workspace.id,
      );

      await loanTransactionRepository.createLoanRepayment({
        user_id: user.id,
        workspace_id: workspace.id,
        amount: input.amount,
        date: input.date,
        description: `Devolución de préstamo de ${loan.borrower_name}`,
        account_id: input.account_id,
        pocket_id: input.pocket_id,
        loan_id: loan.id,
        financial_period_id: period?.id ?? null,
      });

      const { data: pocketData, error: pocketErr } = await getSupabase()
        .from("pockets")
        .select("balance")
        .eq("id", input.pocket_id)
        .single();
      if (pocketErr) throw pocketErr;
      const pocketBalance = Number(
        (pocketData as { balance: number }).balance,
      );
      await pocketRepository.setBalance(
        input.pocket_id,
        pocketBalance + input.amount,
      );

      const { data: acctData, error: acctReadErr } = await getSupabase()
        .from("accounts")
        .select("current_balance")
        .eq("id", input.account_id)
        .single();
      if (acctReadErr) throw acctReadErr;
      const acctBal = Number(
        (acctData as { current_balance: number }).current_balance,
      );
      const { data: updated, error: acctErr } = await getSupabase()
        .from("accounts")
        .update({ current_balance: acctBal + input.amount })
        .eq("id", input.account_id)
        .select("id");
      if (acctErr) throw acctErr;
      if (!updated?.length) throw new Error("ACCOUNT_BALANCE_UPDATE_FAILED");

      await loanRepository.markPaid(loan.id, input.date);

      return { paid: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loans"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["movements"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
