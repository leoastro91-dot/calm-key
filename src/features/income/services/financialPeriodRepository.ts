/**
 * Repository (ADR-001) — financial_periods, lectura del período activo y
 * actualización de total_income_received. No crea ni cierra períodos
 * (fuera de alcance en LOVABLE-004).
 */
import { getSupabase } from "@/features/shared/services/supabaseClient";
import type { ActivePeriod } from "../domain/types";

const COLS =
  "id, user_id, workspace_id, period_type, start_date, end_date, status, expected_income, total_income_received";

export const financialPeriodRepository = {
  async getActive(
    userId: string,
    workspaceId: string,
  ): Promise<ActivePeriod | null> {
    const { data, error } = await getSupabase()
      .from("financial_periods")
      .select(COLS)
      .eq("user_id", userId)
      .eq("workspace_id", workspaceId)
      .eq("status", "active")
      .maybeSingle();
    if (error) throw error;
    return (data as ActivePeriod) ?? null;
  },

  async setTotalIncomeReceived(id: string, total: number): Promise<void> {
    const { error } = await getSupabase()
      .from("financial_periods")
      .update({ total_income_received: total })
      .eq("id", id);
    if (error) throw error;
  },
};
