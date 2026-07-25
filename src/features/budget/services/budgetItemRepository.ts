/**
 * Repository (ADR-001) — budget_items. CRUD del plan por categoría.
 * La ejecución presupuestal se sincroniza desde transactions para cualquier
 * movimiento con category_id + affects_budget, sin depender del type.
 */
import { getSupabase } from "@/features/shared/services/supabaseClient";
import type { BudgetItem } from "../domain/types";

const COLS =
  "id, budget_id, user_id, workspace_id, category_id, projected_amount, actual_amount, current_execution_pct, overspend_amount, alert_threshold_warning, alert_threshold_critical, alert_enabled, alert_frequency, alert_channel, recurrence_type";

const EXECUTION_EPSILON = 0.005;

function executionFields(projectedAmount: number, actualAmount: number) {
  const projected = Number(projectedAmount) || 0;
  const actual = Math.max(0, Number(actualAmount) || 0);
  return {
    actual_amount: actual,
    current_execution_pct: projected > 0 ? (actual / projected) * 100 : 0,
    overspend_amount: Math.max(0, actual - projected),
  };
}

function changed(a: number, b: number) {
  return Math.abs(Number(a) - Number(b)) > EXECUTION_EPSILON;
}

async function transactionTotalsByBudgetItem(
  budgetItemIds: string[],
): Promise<Map<string, number>> {
  const totals = new Map<string, number>();
  if (!budgetItemIds.length) return totals;

  const { data, error } = await getSupabase()
    .from("transactions")
    .select("budget_item_id, amount")
    .in("budget_item_id", budgetItemIds)
    .eq("affects_budget", true)
    .not("category_id", "is", null);

  if (error) throw error;

  for (const row of data ?? []) {
    const tx = row as { budget_item_id: string | null; amount: number };
    if (!tx.budget_item_id) continue;
    totals.set(
      tx.budget_item_id,
      (totals.get(tx.budget_item_id) ?? 0) + Number(tx.amount),
    );
  }
  return totals;
}

async function reconcileItems(items: BudgetItem[]): Promise<BudgetItem[]> {
  const totals = await transactionTotalsByBudgetItem(items.map((i) => i.id));
  return Promise.all(
    items.map(async (item) => {
      const fields = executionFields(
        Number(item.projected_amount),
        totals.get(item.id) ?? 0,
      );
      const needsUpdate =
        changed(Number(item.actual_amount), fields.actual_amount) ||
        changed(Number(item.current_execution_pct), fields.current_execution_pct) ||
        changed(Number(item.overspend_amount), fields.overspend_amount);

      if (!needsUpdate) return item;

      const { error } = await getSupabase()
        .from("budget_items")
        .update(fields)
        .eq("id", item.id);
      if (error) throw error;
      return { ...item, ...fields };
    }),
  );
}

export const budgetItemRepository = {
  async listByBudget(budgetId: string): Promise<BudgetItem[]> {
    const { data, error } = await getSupabase()
      .from("budget_items")
      .select(COLS)
      .eq("budget_id", budgetId);
    if (error) throw error;
    return reconcileItems((data ?? []) as BudgetItem[]);
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
    const totals = await transactionTotalsByBudgetItem([id]);
    const fields = executionFields(projected_amount, totals.get(id) ?? 0);
    const { error } = await getSupabase()
      .from("budget_items")
      .update({
        projected_amount,
        ...fields,
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
   * Reconciliación obligatoria: actual_amount se deriva de SUM(transactions.amount)
   * para toda transacción categorizada que afecte presupuesto, sin importar si
   * es expense, transfer, emergency_use o debt_payment.
   */
  async reconcileByBudget(budgetId: string): Promise<BudgetItem[]> {
    const { data, error } = await getSupabase()
      .from("budget_items")
      .select(COLS)
      .eq("budget_id", budgetId);
    if (error) throw error;
    return reconcileItems((data ?? []) as BudgetItem[]);
  },

  async refreshExecutionForTransaction(input: {
    budget_item_id: string | null | undefined;
    category_id: string | null | undefined;
    affects_budget: boolean;
  }): Promise<BudgetItem | null> {
    if (!input.affects_budget || !input.category_id || !input.budget_item_id) {
      return null;
    }

    const { data, error } = await getSupabase()
      .from("budget_items")
      .select(COLS)
      .eq("id", input.budget_item_id)
      .single();
    if (error) throw error;

    const [item] = await reconcileItems([data as BudgetItem]);
    return item ?? null;
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
   * Compatibilidad con flujos existentes: la fuente de verdad ya no es el
   * delta local sino transactions. Para edición/eliminación de transacciones,
   * llamar refreshExecutionForTransaction() después del cambio revierte o
   * sustituye el efecto automáticamente.
   */
  async applyExpense(item: BudgetItem): Promise<void> {
    await this.refreshExecutionForTransaction({
      budget_item_id: item.id,
      category_id: item.category_id,
      affects_budget: true,
    });
  },
};
