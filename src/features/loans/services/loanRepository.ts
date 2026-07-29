/** Repository (ADR-001): loans — CRUD básico del feature Préstamos a Terceros. */
import { getSupabase } from "@/features/shared/services/supabaseClient";
import type { Loan } from "../domain/types";

const COLS =
  "id, user_id, workspace_id, pocket_id, borrower_name, amount, has_interest, interest_amount, status, date_given, expected_return_date, date_repaid, notes";

export const loanRepository = {
  async listByWorkspace(userId: string, workspaceId: string): Promise<Loan[]> {
    const { data, error } = await getSupabase()
      .from("loans")
      .select(COLS)
      .eq("user_id", userId)
      .eq("workspace_id", workspaceId)
      .order("status", { ascending: true })
      .order("date_given", { ascending: false });
    if (error) throw error;
    return (data as Loan[]) ?? [];
  },

  async getById(id: string): Promise<Loan | null> {
    const { data, error } = await getSupabase()
      .from("loans")
      .select(COLS)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data as Loan) ?? null;
  },

  async create(input: {
    user_id: string;
    workspace_id: string;
    pocket_id: string;
    borrower_name: string;
    amount: number;
    has_interest: boolean;
    interest_amount: number | null;
    date_given: string;
    expected_return_date: string | null;
    notes: string | null;
  }): Promise<Loan> {
    const { data, error } = await getSupabase()
      .from("loans")
      .insert({ ...input, status: "active", date_repaid: null })
      .select(COLS)
      .single();
    if (error) throw error;
    return data as Loan;
  },

  /** Marca el préstamo como pagado. Nunca se revierte ni se elimina la fila. */
  async markPaid(id: string, date_repaid: string): Promise<void> {
    const { data, error } = await getSupabase()
      .from("loans")
      .update({ status: "paid", date_repaid })
      .eq("id", id)
      .select("id");
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("LOAN_UPDATE_FAILED");
  },
};
