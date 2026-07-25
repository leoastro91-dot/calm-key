export type PeriodType = "monthly" | "biweekly" | "weekly" | "custom";
export type AccountType =
  | "savings"
  | "checking"
  | "digital_wallet"
  | "cash"
  | "investment"
  | "credit";
export type IncomeSourceType =
  | "salary"
  | "freelance"
  | "rental"
  | "investment_return"
  | "pension"
  | "other";
export type MoneyState = "available" | "reserved" | "protected" | "committed";

export interface FinancialProfile {
  id: string;
  user_id: string;
  workspace_id: string;
  monthly_income: number;
  needs_pct: number;
  wants_pct: number;
  construction_pct: number;
  period_type: PeriodType;
  period_cycle_start_day: number | null;
  onboarding_completed: boolean;
}

export interface IncomeSource {
  id: string;
  user_id: string;
  workspace_id: string;
  name: string;
  source_type: IncomeSourceType;
  expected_amount: number;
  is_primary: boolean;
  is_active: boolean;
}

export interface FinancialPeriod {
  id: string;
  user_id: string;
  workspace_id: string;
  period_type: PeriodType;
  start_date: string;
  end_date: string;
  status: "active" | "closed" | "archived";
  expected_income: number;
}

export interface Account {
  id: string;
  user_id: string;
  workspace_id: string;
  name: string;
  type: AccountType;
  currency: string;
  opening_balance: number;
  current_balance: number;
  include_in_total: boolean;
  is_active: boolean;
}

export interface Pocket {
  id: string;
  account_id: string;
  user_id: string;
  workspace_id: string;
  name: string;
  money_state: MoneyState;
  balance: number;
  is_active: boolean;
  target_amount: number | null;
}

/** ADR-013 — Cálculo puro de end_date según period_type. */
export function calculateEndDate(periodType: PeriodType, startDate: Date): Date {
  const d = new Date(startDate);
  if (periodType === "monthly") {
    const next = new Date(d);
    next.setMonth(next.getMonth() + 1);
    next.setDate(next.getDate() - 1);
    return next;
  }
  if (periodType === "biweekly") {
    const next = new Date(d);
    next.setDate(next.getDate() + 14);
    return next;
  }
  if (periodType === "weekly") {
    const next = new Date(d);
    next.setDate(next.getDate() + 6);
    return next;
  }
  return d;
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
