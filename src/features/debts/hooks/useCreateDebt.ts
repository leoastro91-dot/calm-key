import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { useWorkspace } from "@/features/identity/hooks/useWorkspace";
import { debtRepository } from "../services/debtRepository";

export interface CreateDebtInput {
  creditor: string;
  capital_initial: number;
  current_balance: number;
  monthly_payment: number | null;
  start_date: string;
  payment_day: number | null;
  notes: string | null;
}

export function useCreateDebt() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDebtInput) => {
      if (!user || !workspace) throw new Error("SESSION_NOT_READY");
      if (!input.creditor.trim()) throw new Error("CREDITOR_REQUIRED");
      if (input.capital_initial <= 0)
        throw new Error("CAPITAL_MUST_BE_POSITIVE");
      if (input.current_balance < 0)
        throw new Error("BALANCE_MUST_BE_NON_NEGATIVE");
      if (input.current_balance > input.capital_initial)
        throw new Error("BALANCE_EXCEEDS_CAPITAL");
      return debtRepository.create({
        user_id: user.id,
        workspace_id: workspace.id,
        creditor: input.creditor.trim(),
        capital_initial: input.capital_initial,
        current_balance: input.current_balance,
        monthly_payment: input.monthly_payment,
        start_date: input.start_date,
        payment_day: input.payment_day,
        notes: input.notes,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["debts"] });
    },
  });
}
