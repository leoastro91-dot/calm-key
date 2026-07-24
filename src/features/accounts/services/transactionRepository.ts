/**
 * Repository (ADR-001): transactions — solo los tipos que el feature Cuentas
 * necesita: 'opening_balance' (creación del bolsillo General) y 'transfer'
 * (financiación de un bolsillo adicional desde General).
 *
 * CHECK (amount > 0) en la base de datos: nunca insertamos amount <= 0.
 */
import { getSupabase } from "@/features/shared/services/supabaseClient";

export const transactionRepository = {
  async createOpeningBalance(input: {
    user_id: string;
    workspace_id: string;
    amount: number;
    date: string;
    account_id: string;
    pocket_id: string;
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
      is_onboarding_entry: false,
      affects_budget: false,
      category_id: null,
      spending_nature: "normal",
    });
    if (error) throw error;
  },

  async createInternalTransfer(input: {
    user_id: string;
    workspace_id: string;
    amount: number;
    date: string;
    account_id: string;
    pocket_id: string;
    to_account_id: string;
    to_pocket_id: string;
    financial_period_id: string | null;
  }): Promise<void> {
    if (input.amount <= 0) {
      throw new Error("TRANSFER_MUST_BE_POSITIVE");
    }
    const { error } = await getSupabase().from("transactions").insert({
      user_id: input.user_id,
      workspace_id: input.workspace_id,
      type: "transfer",
      amount: input.amount,
      date: input.date,
      account_id: input.account_id,
      pocket_id: input.pocket_id,
      to_account_id: input.to_account_id,
      to_pocket_id: input.to_pocket_id,
      financial_period_id: input.financial_period_id,
      is_onboarding_entry: false,
      affects_budget: false,
      category_id: null,
      spending_nature: "normal",
    });
    if (error) throw error;
  },
};
