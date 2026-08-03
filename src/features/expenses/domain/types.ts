/**
 * Dominio del feature Gastos (LOVABLE-007).
 * Sólo type='expense'. Los pagos de deuda (type='debt_payment') se construyen
 * en un incremento posterior — no se manejan aquí.
 */
import type { Account, Pocket } from "@/features/accounts/domain/types";

export type SpendingNature =
  | "normal"
  | "extraordinary"
  | "committed"
  | "recurring";

export const SPENDING_NATURE_LABELS: Record<SpendingNature, string> = {
  normal: "Normal",
  extraordinary: "Extraordinario",
  committed: "Comprometido",
  recurring: "Recurrente",
};

export const SPENDING_NATURE_DESCRIPTIONS: Record<SpendingNature, string> = {
  normal: "Un gasto del día a día.",
  extraordinary: "Algo puntual y fuera de lo común.",
  committed: "Un gasto ya prometido o acordado.",
  recurring: "Se repite cada período (arriendo, servicios…).",
};

/**
 * Origen de financiación (sólo frontend). En Supabase se persiste
 * únicamente con transactions.affects_budget.
 */
export type ExpenseFundingSource = "period_budget" | "accumulated_fund";

export const FUNDING_SOURCE_LABELS: Record<ExpenseFundingSource, string> = {
  period_budget: "Presupuesto del período",
  accumulated_fund: "Fondo acumulado",
};

export const FUNDING_SOURCE_HELP: Record<ExpenseFundingSource, string> = {
  period_budget: "Este gasto consume el presupuesto operativo de este ciclo.",
  accumulated_fund:
    "Este gasto usa dinero que ya estaba acumulado en el bolsillo. Se verá en historial y patrimonio, pero no aumenta el presupuesto ejecutado.",
};

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
}

export interface ExpenseRow {
  id: string;
  type: "expense";
  amount: number;
  date: string;
  description: string | null;
  event_tag: string | null;
  account_id: string;
  pocket_id: string;
  category_id: string | null;
  subcategory_id: string | null;
  budget_item_id: string | null;
  spending_nature: SpendingNature;
  financial_period_id: string | null;
  affects_budget: boolean;
}

export interface ExpenseHistoryItem extends ExpenseRow {
  account: Account | null;
  pocket: Pocket | null;
  categoryName: string | null;
  subcategoryName: string | null;
}

export interface ExecutionStatus {
  level: "ok" | "info" | "warning" | "danger" | "over";
  label: string;
}

/**
 * Umbral visual según pct ejecutado y los thresholds propios del budget_item
 * (ya existentes en la tabla). Devuelve nivel y etiqueta corta.
 */
export function executionStatus(input: {
  pct: number;
  warning: number;
  critical: number;
}): ExecutionStatus {
  const pct = Number.isFinite(input.pct) ? input.pct : 0;
  if (pct > 100) return { level: "over", label: "Sobrepasado" };
  if (pct >= 100) return { level: "danger", label: "En el límite" };
  if (pct >= input.critical) return { level: "danger", label: "Crítico" };
  if (pct >= input.warning) return { level: "warning", label: "Atento" };
  if (pct > 0) return { level: "info", label: "En curso" };
  return { level: "ok", label: "Sin ejecución" };
}
