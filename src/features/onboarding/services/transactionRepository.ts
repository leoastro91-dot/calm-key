/**
 * Repository (ADR-001): transactions — solo el método necesario para
 * registrar Opening Balance (ADR-016). El CRUD completo de movimientos
 * pertenece a LOVABLE-005.
 *
 * IMPORTANTE: transactions.amount tiene CHECK (amount > 0). Este método
 * NUNCA debe llamarse con amount <= 0 — el caller (useCompleteOnboarding)
 * es responsable de omitir la llamada cuando el saldo inicial es cero.
 */
import { getSupabase } from "@/features/shared/services/supabaseClient";

export const transactionRepository = {
  async createOpeningBalance(input: {
    user_id: string;
    workspace_id: string;
    amount: number;
    date: string;
    account_id: string;
    pocket_id: string | null;
  }): Promise<void> {
    if (input.amount <= 0) {
      throw new Error("OPENING_BALANCE_MUST_BE_POSITIVE");
    }
    const { error } = await getSupabase().from("transactions").insert({
      user_id: input.user_id,
      workspace_id: input.workspace_id,
      type: "opening_balance",
      amount: input.amount,
      date: input.date,
      account_id: input.account_id,
      pocket_id: input.pocket_id,
      financial_period_id: null,
      is_onboarding_entry: true,
      affects_budget: false,
      category_id: null,
      spending_nature: "normal",
    });
    if (error) throw error;
  },
};
