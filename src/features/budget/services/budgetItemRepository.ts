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
    .select("budget_item_id, amount, type")
    .in("budget_item_id", budgetItemIds)
    .eq("affects_budget", true)
    .not("category_id", "is", null);

  if (error) throw error;

  for (const row of data ?? []) {
    const tx = row as {
      budget_item_id: string | null;
      amount: number;
      type: string;
    };
    if (!tx.budget_item_id) continue;
    // 'emergency_use' libera dinero de esa categoría: resta ejecución.
    // expense / debt_payment / transfer categorizados: suman.
    const signed =
      tx.type === "emergency_use" ? -Number(tx.amount) : Number(tx.amount);
    totals.set(
      tx.budget_item_id,
      (totals.get(tx.budget_item_id) ?? 0) + signed,
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

async function getBudgetMeta(budgetId: string) {
  const { data, error } = await getSupabase()
    .from("budgets")
    .select("id, user_id, workspace_id, financial_period_id")
    .eq("id", budgetId)
    .single();
  if (error) throw error;
  return data as {
    id: string;
    user_id: string;
    workspace_id: string;
    financial_period_id: string;
  };
}

/**
 * Gastos no presupuestados: una categoría real que no estaba en el plan
 * se incorpora automáticamente con proyectado 0, para que su ejecución
 * reduzca el disponible y se refleje como sobrepaso.
 */
async function findOrCreate(budgetId: string, categoryId: string) {
  const { data, error } = await getSupabase()
    .from("budget_items")
    .select(COLS)
    .eq("budget_id", budgetId)
    .eq("category_id", categoryId)
    .maybeSingle();
  if (error) throw error;
  if (data) return data as BudgetItem;
  const meta = await getBudgetMeta(budgetId);
  return budgetItemRepository.create({
    budget_id: budgetId,
    user_id: meta.user_id,
    workspace_id: meta.workspace_id,
    category_id: categoryId,
    projected_amount: 0,
  });
}

/** Vincula transacciones del período que quedaron sin budget_item_id. */
async function linkOrphanTransactions(budgetId: string) {
  const meta = await getBudgetMeta(budgetId);
  const { data, error } = await getSupabase()
    .from("transactions")
    .select("id, category_id")
    .eq("financial_period_id", meta.financial_period_id)
    .eq("affects_budget", true)
    .not("category_id", "is", null)
    .is("budget_item_id", null);
  if (error) throw error;
  const rows = (data ?? []) as { id: string; category_id: string }[];
  const byCat = new Map<string, string[]>();
  for (const r of rows) {
    byCat.set(r.category_id, [...(byCat.get(r.category_id) ?? []), r.id]);
  }
  for (const [catId, ids] of byCat) {
    const item = await findOrCreate(budgetId, catId);
    const { error: upErr } = await getSupabase()
      .from("transactions")
      .update({ budget_item_id: item.id })
      .in("id", ids);
    if (upErr) throw upErr;
  }
}

export const budgetItemRepository = {
  async listByBudget(budgetId: string): Promise<BudgetItem[]> {
    await linkOrphanTransactions(budgetId);
    const { data, error } = await getSupabase()
      .from("budget_items")
      .select(COLS)
      .eq("budget_id", budgetId);
    if (error) throw error;
    return reconcileItems((data ?? []) as BudgetItem[]);
  },

  findOrCreateByCategory(budgetId: string, categoryId: string) {
    return findOrCreate(budgetId, categoryId);
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
