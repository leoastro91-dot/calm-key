/**
 * Repository (ADR-001) — transactions para el feature Deudas.
 * Sólo type='debt_payment'. CHECK (amount > 0) en DB.
 * transactions.amount = monto total pagado (el movimiento real de dinero).
 *
 * v1.1 (LOVABLE-010 v1.1): el desglose capital/interés se persiste en la
 * columna transactions.interest_amount (SQL-MIG-013). Los resúmenes por deuda
 * y el total general se derivan SIEMPRE de la suma real de transactions —
 * nunca de un contador paralelo.
 */
import { getSupabase } from "@/features/shared/services/supabaseClient";
import type { DebtPaymentRow, DebtPaymentsSummary } from "../domain/types";

const COLS =
  "id, type, amount, interest_amount, date, description, account_id, pocket_id, debt_id";

export const debtTransactionRepository = {
  async createDebtPayment(input: {
    user_id: string;
    workspace_id: string;
    amount: number;
    interest_amount: number;
    date: string;
    description: string | null;
    account_id: string;
    pocket_id: string;
    debt_id: string;
    financial_period_id: string | null;
    category_id?: string | null;
    budget_item_id?: string | null;
    affects_budget?: boolean;
  }): Promise<{ id: string }> {
    if (input.amount <= 0) throw new Error("DEBT_PAYMENT_MUST_BE_POSITIVE");
    if (input.interest_amount < 0) throw new Error("INTEREST_MUST_NOT_BE_NEGATIVE");
    const { data, error } = await getSupabase()
      .from("transactions")
      .insert({
        user_id: input.user_id,
        workspace_id: input.workspace_id,
        type: "debt_payment",
        amount: input.amount,
        interest_amount: input.interest_amount,
        date: input.date,
        description: input.description,
        account_id: input.account_id,
        pocket_id: input.pocket_id,
        to_account_id: null,
        to_pocket_id: null,
        debt_id: input.debt_id,
        category_id: input.category_id ?? null,
        subcategory_id: null,
        budget_item_id: input.budget_item_id ?? null,
        financial_period_id: input.financial_period_id,
        spending_nature: "normal",
        affects_budget: input.affects_budget ?? false,
        is_onboarding_entry: false,
      })
      .select("id")
      .single();
    if (error) throw error;
    return data as { id: string };
  },

  async listByDebt(
    userId: string,
    workspaceId: string,
    debtId: string,
  ): Promise<DebtPaymentRow[]> {
    const { data, error } = await getSupabase()
      .from("transactions")
      .select(COLS)
      .eq("user_id", userId)
      .eq("workspace_id", workspaceId)
      .eq("type", "debt_payment")
      .eq("debt_id", debtId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as DebtPaymentRow[]) ?? [];
  },

  /** Resumen (total / capital / interés) por deuda, derivado de transactions. */
  async summariesByWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<Record<string, DebtPaymentsSummary>> {
    const { data, error } = await getSupabase()
      .from("transactions")
      .select("debt_id, amount, interest_amount")
      .eq("user_id", userId)
      .eq("workspace_id", workspaceId)
      .eq("type", "debt_payment");
    if (error) throw error;
    const rows =
      (data as {
        debt_id: string | null;
        amount: number;
        interest_amount: number | null;
      }[]) ?? [];

    const map: Record<string, DebtPaymentsSummary> = {};
    for (const r of rows) {
      if (!r.debt_id) continue;
      const total = Number(r.amount) || 0;
      const interest = Number(r.interest_amount ?? 0) || 0;
      const acc =
        map[r.debt_id] ??
        (map[r.debt_id] = { total: 0, capital: 0, interest: 0 });
      acc.total += total;
      acc.interest += interest;
      acc.capital += total - interest;
    }
    return map;
  },
};
