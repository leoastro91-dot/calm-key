/**
 * Dominio del feature Presupuesto (LOVABLE-006).
 * El plan por categoría del período activo. La ejecución real
 * (actual_amount) queda en 0 hasta LOVABLE-007 (registro de gastos).
 */

export type Block5030 = "needs" | "wants" | "construction";

export interface Category {
  id: string;
  user_id: string | null;
  workspace_id: string | null;
  name: string;
  block_5030: Block5030;
  is_system: boolean;
  icon: string | null;
}

export interface Budget {
  id: string;
  user_id: string;
  workspace_id: string;
  financial_period_id: string;
  status: "active" | "closed" | "archived";
}

export interface BudgetItem {
  id: string;
  budget_id: string;
  user_id: string;
  workspace_id: string;
  category_id: string;
  projected_amount: number;
  actual_amount: number;
  current_execution_pct: number;
  overspend_amount: number;
  alert_threshold_warning: number;
  alert_threshold_critical: number;
  alert_enabled: boolean;
  alert_frequency: string;
  alert_channel: string;
  recurrence_type: string;
}

export interface BudgetItemWithCategory extends BudgetItem {
  category: Pick<Category, "id" | "name" | "block_5030"> | null;
}

export const BLOCK_LABELS: Record<Block5030, string> = {
  needs: "Necesidades",
  wants: "Deseos",
  construction: "Construcción",
};

export const BLOCK_ORDER: Block5030[] = ["needs", "wants", "construction"];

/**
 * Devuelve el porcentaje objetivo del bloque según el perfil financiero.
 */
export function blockPct(
  block: Block5030,
  profile: { needs_pct: number; wants_pct: number; construction_pct: number },
): number {
  if (block === "needs") return profile.needs_pct;
  if (block === "wants") return profile.wants_pct;
  return profile.construction_pct;
}

/**
 * Objetivo monetario de un bloque = monthly_income * pct / 100.
 */
export function blockTarget(
  block: Block5030,
  profile: {
    monthly_income: number;
    needs_pct: number;
    wants_pct: number;
    construction_pct: number;
  },
): number {
  return Number(profile.monthly_income) * (blockPct(block, profile) / 100);
}
