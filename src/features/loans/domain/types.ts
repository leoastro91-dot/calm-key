/**
 * Dominio del feature Préstamos a Terceros (LOVABLE-012).
 * Cristian es el acreedor: presta dinero a una persona (texto libre).
 * Nunca afecta presupuesto (affects_budget = false siempre).
 */

export type LoanStatus = "active" | "paid";

export const LOAN_STATUS_LABELS: Record<LoanStatus, string> = {
  active: "Activo",
  paid: "Pagado",
};

export interface Loan {
  id: string;
  user_id: string;
  workspace_id: string;
  pocket_id: string | null;
  borrower_name: string;
  amount: number;
  has_interest: boolean;
  interest_amount: number | null;
  status: LoanStatus;
  date_given: string; // YYYY-MM-DD
  expected_return_date: string | null;
  date_repaid: string | null;
  notes: string | null;
}

/** Monto esperado de vuelta: capital + interés esperado si aplica. */
export function expectedReturnAmount(loan: Loan): number {
  const base = Number(loan.amount) || 0;
  const interest = loan.has_interest ? Number(loan.interest_amount) || 0 : 0;
  return base + interest;
}

/** ¿La fecha esperada de devolución ya pasó y el préstamo sigue activo? */
export function isOverdue(loan: Loan, today = new Date()): boolean {
  if (loan.status !== "active" || !loan.expected_return_date) return false;
  return loan.expected_return_date < today.toISOString().slice(0, 10);
}
