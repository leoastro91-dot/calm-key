/**
 * Repository (ADR-001) — budgets. Get-or-create idempotente del presupuesto
 * del período activo (protegido por uq_budgets_period_user).
 */
import { getSupabase } from "@/features/shared/services/supabaseClient";
import type { Budget } from "../domain/types";

const COLS = "id, user_id, workspace_id, financial_period_id, status";

export const budgetRepository = {
  async getByPeriod(
    userId: string,
    financialPeriodId: string,
  ): Promise<Budget | null> {
    const { data, error } = await getSupabase()
      .from("budgets")
      .select(COLS)
      .eq("user_id", userId)
      .eq("financial_period_id", financialPeriodId)
      .maybeSingle();
    if (error) throw error;
    return (data as Budget) ?? null;
  },

  async getOrCreateForActivePeriod(input: {
    user_id: string;
    workspace_id: string;
    financial_period_id: string;
  }): Promise<Budget> {
    const existing = await this.getByPeriod(
      input.user_id,
      input.financial_period_id,
    );
    if (existing) return existing;

    const { data, error } = await getSupabase()
      .from("budgets")
      .insert({
        user_id: input.user_id,
        workspace_id: input.workspace_id,
        financial_period_id: input.financial_period_id,
        status: "active",
      })
      .select(COLS)
      .single();

    // Carrera concurrente: si el índice único disparó, releer.
    if (error) {
      const retry = await this.getByPeriod(
        input.user_id,
        input.financial_period_id,
      );
      if (retry) return retry;
      throw error;
    }
    return data as Budget;
  },
};
