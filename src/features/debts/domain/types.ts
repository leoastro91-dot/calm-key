/**
 * Dominio del feature Deudas Base (LOVABLE-010).
 * Sólo el registro base: crear deuda, ver saldo, abonar.
 * El cronograma de amortización y estrategias snowball/avalanche son Motor 3
 * (fuera de alcance en este incremento).
 */
import type { Account, Pocket } from "@/features/accounts/domain/types";

export type DebtStatus = "active" | "paid" | "in_arrears" | "restructured";

export const DEBT_STATUS_LABELS: Record<DebtStatus, string> = {
  active: "Activa",
  paid: "Pagada",
  in_arrears: "En mora",
  restructured: "Reestructurada",
};

export interface Debt {
  id: string;
  user_id: string;
  workspace_id: string;
  creditor: string;
  capital_initial: number;
  current_balance: number;
  monthly_payment: number | null;
  start_date: string; // YYYY-MM-DD
  payment_day: number | null;
  status: DebtStatus;
  notes: string | null;
}

export interface DebtPaymentRow {
  id: string;
  type: "debt_payment";
  amount: number;
  /** Parte del monto total que fue interés (0 si no hubo interés). */
  interest_amount: number | null;
  date: string;
  description: string | null;
  account_id: string;
  pocket_id: string;
  debt_id: string;
}

export interface DebtPaymentHistoryItem extends DebtPaymentRow {
  account: Account | null;
  pocket: Pocket | null;
}

/** Totales acumulados de abonos de una deuda (derivados de transactions). */
export interface DebtPaymentsSummary {
  total: number;
  capital: number;
  interest: number;
}

export const EMPTY_PAYMENTS_SUMMARY: DebtPaymentsSummary = {
  total: 0,
  capital: 0,
  interest: 0,
};

/** Parte de interés de un abono: monto total − abono a capital (piso en 0). */
export function interestFromPayment(
  amountTotal: number,
  amountCapital: number,
): number {
  return Math.max(0, amountTotal - amountCapital);
}


/** Progreso pagado (capital_initial - current_balance) sobre capital_initial. */
export function paidProgress(debt: Debt): {
  paid: number;
  pct: number;
} {
  const capital = Number(debt.capital_initial);
  const balance = Number(debt.current_balance);
  const paid = Math.max(0, capital - balance);
  const pct = capital > 0 ? Math.min(100, (paid / capital) * 100) : 0;
  return { paid, pct };
}
