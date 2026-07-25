/**
 * Repository (ADR-001) — transactions para el feature Gastos.
 * Sólo type='expense'. CHECK (amount > 0) en DB.
 */
import { getSupabase } from "@/features/shared/services/supabaseClient";
import type { ExpenseRow, SpendingNature } from "../domain/types";

const COLS =
  "id, type, amount, date, description, event_tag, account_id, pocket_id, category_id, subcategory_id, budget_item_id, spending_nature, financial_period_id";

export const expenseTransactionRepository = {
  async createExpense(input: {
    user_id: string;
    workspace_id: string;
    amount: number;
    date: string;
    description: string | null;
    event_tag: string | null;
    account_id: string;
    pocket_id: string;
    category_id: string;
    subcategory_id: string | null;
    financial_period_id: string | null;
    spending_nature: SpendingNature;
    budget_item_id: string | null;
  }): Promise<{ id: string }> {
    if (input.amount <= 0) throw new Error("EXPENSE_MUST_BE_POSITIVE");
    const { data, error } = await getSupabase()
      .from("transactions")
      .insert({
        user_id: input.user_id,
        workspace_id: input.workspace_id,
        type: "expense",
        amount: input.amount,
        date: input.date,
        description: input.description,
        event_tag: input.event_tag,
        account_id: input.account_id,
        pocket_id: input.pocket_id,
        to_account_id: null,
        to_pocket_id: null,
        category_id: input.category_id,
        subcategory_id: input.subcategory_id,
        financial_period_id: input.financial_period_id,
        spending_nature: input.spending_nature,
        affects_budget: true,
        budget_item_id: input.budget_item_id,
        is_onboarding_entry: false,
      })
      .select("id")
      .single();
    if (error) throw error;
    return data as { id: string };
  },

  async listByPeriod(
    userId: string,
    workspaceId: string,
    financialPeriodId: string,
  ): Promise<ExpenseRow[]> {
    const { data, error } = await getSupabase()
      .from("transactions")
      .select(COLS)
      .eq("user_id", userId)
      .eq("workspace_id", workspaceId)
      .eq("type", "expense")
      .eq("financial_period_id", financialPeriodId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as ExpenseRow[]) ?? [];
  },
};
