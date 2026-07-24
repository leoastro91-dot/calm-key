/**
 * Repository (ADR-001) — period_incomes: creación y listado por período.
 * income_source_id es NOT NULL en la base: el caller debe garantizarlo.
 */
import { getSupabase } from "@/features/shared/services/supabaseClient";
import type { PeriodIncomeWithSource } from "../domain/types";

const COLS =
  "id, user_id, workspace_id, financial_period_id, income_source_id, transaction_id, amount_received, received_date, variance_amount, notes";

const COLS_WITH_SOURCE = `${COLS}, income_source:income_sources(id, name, source_type)`;

export const periodIncomeRepository = {
  async create(input: {
    user_id: string;
    workspace_id: string;
    financial_period_id: string;
    income_source_id: string;
    transaction_id: string;
    amount_received: number;
    received_date: string;
    variance_amount: number;
    notes: string | null;
  }): Promise<void> {
    const { error } = await getSupabase()
      .from("period_incomes")
      .insert(input);
    if (error) throw error;
  },

  async listByPeriod(
    financialPeriodId: string,
  ): Promise<PeriodIncomeWithSource[]> {
    const { data, error } = await getSupabase()
      .from("period_incomes")
      .select(COLS_WITH_SOURCE)
      .eq("financial_period_id", financialPeriodId)
      .order("received_date", { ascending: false });
    if (error) throw error;
    return (data as unknown as PeriodIncomeWithSource[]) ?? [];
  },
};
