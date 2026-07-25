/**
 * Repository (ADR-001): debts — CRUD base del feature Deudas.
 * No maneja debt_schedules ni debt_strategies (Motor 3, fuera de alcance).
 */
import { getSupabase } from "@/features/shared/services/supabaseClient";
import type { Debt, DebtStatus } from "../domain/types";

const COLS =
  "id, user_id, workspace_id, creditor, capital_initial, current_balance, monthly_payment, start_date, payment_day, status, notes";

export const debtRepository = {
  async listByWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<Debt[]> {
    const { data, error } = await getSupabase()
      .from("debts")
      .select(COLS)
      .eq("user_id", userId)
      .eq("workspace_id", workspaceId)
      .order("status", { ascending: true })
      .order("creditor", { ascending: true });
    if (error) throw error;
    return (data as Debt[]) ?? [];
  },

  async getById(id: string): Promise<Debt | null> {
    const { data, error } = await getSupabase()
      .from("debts")
      .select(COLS)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data as Debt) ?? null;
  },

  async create(input: {
    user_id: string;
    workspace_id: string;
    creditor: string;
    capital_initial: number;
    current_balance: number;
    monthly_payment: number | null;
    start_date: string;
    payment_day: number | null;
    notes: string | null;
  }): Promise<Debt> {
    const { data, error } = await getSupabase()
      .from("debts")
      .insert({
        user_id: input.user_id,
        workspace_id: input.workspace_id,
        creditor: input.creditor,
        capital_initial: input.capital_initial,
        current_balance: input.current_balance,
        monthly_payment: input.monthly_payment,
        start_date: input.start_date,
        payment_day: input.payment_day,
        notes: input.notes,
        status: "active" as DebtStatus,
      })
      .select(COLS)
      .single();
    if (error) throw error;
    return data as Debt;
  },

  async setBalanceAndStatus(
    id: string,
    current_balance: number,
    status: DebtStatus,
  ): Promise<void> {
    const { error } = await getSupabase()
      .from("debts")
      .update({ current_balance, status })
      .eq("id", id);
    if (error) throw error;
  },
};
