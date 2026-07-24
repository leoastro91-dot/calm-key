/**
 * Repository (ADR-001) — transactions: escritura de un ingreso real.
 * CHECK (amount > 0) en la base de datos: nunca insertamos amount <= 0.
 * Devuelve el id de la transaction para vincular con period_incomes.
 */
import { getSupabase } from "@/features/shared/services/supabaseClient";

export const transactionRepository = {
  async createIncome(input: {
    user_id: string;
    workspace_id: string;
    amount: number;
    date: string;
    account_id: string;
    pocket_id: string;
    financial_period_id: string;
  }): Promise<{ id: string }> {
    if (input.amount <= 0) throw new Error("INCOME_MUST_BE_POSITIVE");
    const { data, error } = await getSupabase()
      .from("transactions")
      .insert({
        user_id: input.user_id,
        workspace_id: input.workspace_id,
        type: "income",
        amount: input.amount,
        date: input.date,
        account_id: input.account_id,
        pocket_id: input.pocket_id,
        financial_period_id: input.financial_period_id,
        category_id: null,
        spending_nature: "normal",
        affects_budget: false,
        is_onboarding_entry: false,
      })
      .select("id")
      .single();
    if (error) throw error;
    return data as { id: string };
  },
};
