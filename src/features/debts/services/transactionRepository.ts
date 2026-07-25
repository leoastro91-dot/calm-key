/**
 * Repository (ADR-001) — transactions para el feature Deudas.
 * Sólo type='debt_payment'. CHECK (amount > 0) en DB.
 * transactions.amount = monto total pagado (el movimiento real de dinero).
 * El desglose capital/interés no se persiste aquí: se usa sólo para restar
 * al saldo de la deuda (ver useRegisterDebtPayment).
 *
 * v1.1: acepta category_id/budget_item_id/affects_budget opcionales para
 * vincular el abono a una línea del presupuesto activo — mismo patrón que
 * los traslados categorizados de LOVABLE-005 v1.1.
 */
import { getSupabase } from "@/features/shared/services/supabaseClient";
import type { DebtPaymentRow } from "../domain/types";

const COLS =
  "id, type, amount, date, description, account_id, pocket_id, debt_id";

export const debtTransactionRepository = {
  async createDebtPayment(input: {
    user_id: string;
    workspace_id: string;
    amount: number;
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
    const { data, error } = await getSupabase()
      .from("transactions")
      .insert({
        user_id: input.user_id,
        workspace_id: input.workspace_id,
        type: "debt_payment",
        amount: input.amount,
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
};
