/**
 * Repository (ADR-001) — budget_items. CRUD del plan por categoría.
 * Extendido en LOVABLE-007 con findByCategory() y applyExpense() para
 * mantener actual_amount / current_execution_pct / overspend_amount al día.
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
    // Releer actual_amount para recalcular pct y sobre-ejecución con el
    // nuevo proyectado — si no, el badge sigue mostrando el % viejo.
    const { data: current, error: readErr } = await getSupabase()
      .from("budget_items")
      .select("actual_amount")
      .eq("id", id)
      .single();
    if (readErr) throw readErr;
    const actual = Number((current as { actual_amount: number }).actual_amount) || 0;
    const pct = projected_amount > 0 ? (actual / projected_amount) * 100 : 0;
    const overspend = Math.max(0, actual - projected_amount);
    const { error } = await getSupabase()
      .from("budget_items")
      .update({
        projected_amount,
        current_execution_pct: pct,
        overspend_amount: overspend,
      })
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

  /**
   * Busca la línea de presupuesto de una categoría dentro de un budget dado.
   * Devuelve null si no existe (no es error — el gasto se registra igual).
   */
  async findByCategory(
    budgetId: string,
    categoryId: string,
  ): Promise<BudgetItem | null> {
    const { data, error } = await getSupabase()
      .from("budget_items")
      .select(COLS)
      .eq("budget_id", budgetId)
      .eq("category_id", categoryId)
      .maybeSingle();
    if (error) throw error;
    return (data as BudgetItem) ?? null;
  },

  /**
   * Suma delta al actual_amount y recalcula porcentaje y sobre-ejecución.
   * delta puede ser positivo (nuevo gasto) o negativo (reversión).
   */
  async applyExpense(item: BudgetItem, delta: number): Promise<void> {
    const projected = Number(item.projected_amount) || 0;
    const nuevo = Number(item.actual_amount) + delta;
    const pct = projected > 0 ? (nuevo / projected) * 100 : 0;
    const overspend = Math.max(0, nuevo - projected);
    const { error } = await getSupabase()
      .from("budget_items")
      .update({
        actual_amount: nuevo,
        current_execution_pct: pct,
        overspend_amount: overspend,
      })
      .eq("id", item.id);
    if (error) throw error;
  },
};
