/** Repository (ADR-001): financial_profiles. Idempotente vía uq_financial_profile. */
import { getSupabase } from "@/features/shared/services/supabaseClient";
import type { FinancialProfile, PeriodType } from "../domain/types";

const COLS =
  "id, user_id, workspace_id, monthly_income, needs_pct, wants_pct, construction_pct, period_type, period_cycle_start_day, onboarding_completed";

export const financialProfileRepository = {
  async getByUser(userId: string, workspaceId: string): Promise<FinancialProfile | null> {
    const { data, error } = await getSupabase()
      .from("financial_profiles")
      .select(COLS)
      .eq("user_id", userId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    if (error) throw error;
    return (data as FinancialProfile) ?? null;
  },

  async createOrGet(input: {
    user_id: string;
    workspace_id: string;
    monthly_income: number;
    needs_pct: number;
    wants_pct: number;
    construction_pct: number;
    period_type: PeriodType;
    period_cycle_start_day: number | null;
  }): Promise<FinancialProfile> {
    const existing = await this.getByUser(input.user_id, input.workspace_id);
    if (existing) return existing;
    const { data, error } = await getSupabase()
      .from("financial_profiles")
      .insert({ ...input, onboarding_completed: false })
      .select(COLS)
      .single();
    if (error) throw error;
    return data as FinancialProfile;
  },

  async markCompleted(id: string): Promise<void> {
    const { error } = await getSupabase()
      .from("financial_profiles")
      .update({ onboarding_completed: true })
      .eq("id", id);
    if (error) throw error;
  },

  /**
   * LOVABLE-008 — actualiza solo los 3 porcentajes 50/30/20.
   * Cliente valida suma=100; la DB refuerza vía chk_pct_sum.
   */
  async updateDistribution(
    id: string,
    input: { needs_pct: number; wants_pct: number; construction_pct: number },
  ): Promise<void> {
    const sum = input.needs_pct + input.wants_pct + input.construction_pct;
    if (sum !== 100) throw new Error("PCT_SUM_MUST_BE_100");
    const { error } = await getSupabase()
      .from("financial_profiles")
      .update({
        needs_pct: input.needs_pct,
        wants_pct: input.wants_pct,
        construction_pct: input.construction_pct,
      })
      .eq("id", id);
    if (error) throw error;
  },
};
