/** Repository (ADR-001): financial_periods. Idempotente vía idx_financial_periods_one_active. */
import { getSupabase } from "@/features/shared/services/supabaseClient";
import type { FinancialPeriod, PeriodType } from "../domain/types";

const COLS =
  "id, user_id, workspace_id, period_type, start_date, end_date, status, expected_income";

export const financialPeriodRepository = {
  async getActive(userId: string, workspaceId: string): Promise<FinancialPeriod | null> {
    const { data, error } = await getSupabase()
      .from("financial_periods")
      .select(COLS)
      .eq("user_id", userId)
      .eq("workspace_id", workspaceId)
      .eq("status", "active")
      .maybeSingle();
    if (error) throw error;
    return (data as FinancialPeriod) ?? null;
  },

  async createOrGetActive(input: {
    user_id: string;
    workspace_id: string;
    period_type: PeriodType;
    start_date: string;
    end_date: string;
    expected_income: number;
  }): Promise<FinancialPeriod> {
    const existing = await this.getActive(input.user_id, input.workspace_id);
    if (existing) return existing;
    const { data, error } = await getSupabase()
      .from("financial_periods")
      .insert({ ...input, status: "active" })
      .select(COLS)
      .single();
    if (error) throw error;
    return data as FinancialPeriod;
  },
};
