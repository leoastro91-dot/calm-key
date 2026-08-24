/**
 * Repository (ADR-001) — financial_periods: lectura del período activo,
 * actualización de total_income_received, cierre de período y apertura
 * del siguiente ciclo.
 */
import { getSupabase } from "@/features/shared/services/supabaseClient";
import type { ActivePeriod, PeriodType } from "../domain/types";

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

  /** Marca el período como cerrado (status='closed'). */
  async close(id: string): Promise<void> {
    const { data, error } = await getSupabase()
      .from("financial_periods")
      .update({ status: "closed" })
      .eq("id", id)
      .select("id");
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("PERIOD_CLOSE_FAILED");
  },

  /** Abre el siguiente período. Requiere que no exista otro activo. */
  async createActive(input: {
    user_id: string;
    workspace_id: string;
    period_type: PeriodType;
    start_date: string;
    end_date: string;
    expected_income: number;
  }): Promise<ActivePeriod> {
    const { data, error } = await getSupabase()
      .from("financial_periods")
      .insert({ ...input, status: "active", total_income_received: 0 })
      .select(COLS)
      .single();
    if (error) throw error;
    return data as ActivePeriod;
  },

  async listClosed(
    userId: string,
    workspaceId: string,
  ): Promise<ActivePeriod[]> {
    const { data, error } = await getSupabase()
      .from("financial_periods")
      .select(COLS)
      .eq("user_id", userId)
      .eq("workspace_id", workspaceId)
      .neq("status", "active")
      .order("start_date", { ascending: false })
      .limit(12);
    if (error) throw error;
    return (data as ActivePeriod[]) ?? [];
  },
};
