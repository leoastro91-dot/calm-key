/**
 * Resúmenes de abonos (total / capital / interés) — LOVABLE-010 v1.1.
 * Siempre derivados de la suma real de transactions (type='debt_payment'),
 * nunca de un contador paralelo que se pueda desincronizar.
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { useWorkspace } from "@/features/identity/hooks/useWorkspace";
import { debtTransactionRepository } from "../services/transactionRepository";
import {
  EMPTY_PAYMENTS_SUMMARY,
  type DebtPaymentsSummary,
} from "../domain/types";

export function useDebtPaymentSummaries() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();

  const q = useQuery({
    queryKey: ["debts", "payment-summaries", workspace?.id],
    enabled: Boolean(user && workspace),
    queryFn: () =>
      debtTransactionRepository.summariesByWorkspace(user!.id, workspace!.id),
  });

  const byDebt = q.data ?? {};
  const totals: DebtPaymentsSummary = Object.values(byDebt).reduce(
    (acc, s) => ({
      total: acc.total + s.total,
      capital: acc.capital + s.capital,
      interest: acc.interest + s.interest,
      interestPayments: acc.interestPayments + s.interestPayments,
    }),
    { ...EMPTY_PAYMENTS_SUMMARY },
  );

  return {
    byDebt,
    totals,
    getSummary: (debtId: string): DebtPaymentsSummary =>
      byDebt[debtId] ?? EMPTY_PAYMENTS_SUMMARY,
    isLoading: q.isLoading,
  };
}
