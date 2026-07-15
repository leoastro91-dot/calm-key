/** Repository (ADR-001): income_sources. Idempotente vía idx_income_sources_one_primary. */
import { getSupabase } from "@/features/shared/services/supabaseClient";
import type { IncomeSource, IncomeSourceType } from "../domain/types";

const COLS =
  "id, user_id, workspace_id, name, source_type, expected_amount, is_primary, is_active";

export const incomeSourceRepository = {
  async getPrimary(userId: string, workspaceId: string): Promise<IncomeSource | null> {
    const { data, error } = await getSupabase()
      .from("income_sources")
      .select(COLS)
      .eq("user_id", userId)
      .eq("workspace_id", workspaceId)
      .eq("is_primary", true)
      .maybeSingle();
    if (error) throw error;
    return (data as IncomeSource) ?? null;
  },

  async createOrGetPrimary(input: {
    user_id: string;
    workspace_id: string;
    name: string;
    source_type: IncomeSourceType;
    expected_amount: number;
  }): Promise<IncomeSource> {
    const existing = await this.getPrimary(input.user_id, input.workspace_id);
    if (existing) return existing;
    const { data, error } = await getSupabase()
      .from("income_sources")
      .insert({ ...input, is_primary: true, is_active: true })
      .select(COLS)
      .single();
    if (error) throw error;
    return data as IncomeSource;
  },
};
