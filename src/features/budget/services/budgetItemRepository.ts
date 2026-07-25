/**
 * Repository (ADR-001) — budget_items. CRUD del plan por categoría.
 * actual_amount siempre queda en 0 hasta LOVABLE-007 (gastos).
 */
import { getSupabase } from "@/features/shared/services/supabaseClient";
import type { BudgetItem } from "../domain/types";

const COLS =
  "id, budget_id, user_id, workspace_id, category_id, projected_amount, actual_amount, current_execution_pct, overspend_amount, alert_threshold_warning, alert_threshold_critical, alert_enabled, alert_frequency, alert_channel, recurrence_type";

export const budgetItemRepository = {
  async listByBudget(budgetId: string): Promise<BudgetItem[]> {
    const { data, error } = await getSupabase()
      .from("budget_items")
      .select(COLS)
      .eq("budget_id", budgetId);
    if (error) throw error;
    return (data ?? []) as BudgetItem[];
  },

  async create(input: {
    budget_id: string;
    user_id: string;
    workspace_id: string;
    category_id: string;
    projected_amount: number;
  }): Promise<BudgetItem> {
    const { data, error } = await getSupabase()
      .from("budget_items")
      .insert({
        budget_id: input.budget_id,
        user_id: input.user_id,
        workspace_id: input.workspace_id,
        category_id: input.category_id,
        projected_amount: input.projected_amount,
        actual_amount: 0,
        current_execution_pct: 0,
        overspend_amount: 0,
        alert_threshold_warning: 50,
        alert_threshold_critical: 80,
        alert_enabled: true,
        alert_frequency: "immediate",
        alert_channel: "dashboard_only",
        recurrence_type: "occasional",
      })
      .select(COLS)
      .single();
    if (error) throw error;
    return data as BudgetItem;
  },

  async updateProjected(id: string, projected_amount: number): Promise<void> {
    const { error } = await getSupabase()
      .from("budget_items")
      .update({ projected_amount })
      .eq("id", id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await getSupabase()
      .from("budget_items")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};
