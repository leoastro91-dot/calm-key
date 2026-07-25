/**
 * Repository (ADR-001): transactions — extendido para traslados internos.
 * Solo tipos 'transfer' y 'emergency_use'. CHECK (amount > 0) en la DB.
 */
import { getSupabase } from "@/features/shared/services/supabaseClient";
import type { TransferRow, TransferType } from "../domain/types";

const COLS =
  "id, type, amount, date, description, account_id, pocket_id, to_account_id, to_pocket_id";

export const transferTransactionRepository = {
  async create(input: {
    user_id: string;
    workspace_id: string;
    type: TransferType;
    amount: number;
    date: string;
    description: string | null;
    account_id: string;
    pocket_id: string;
    to_account_id: string;
    to_pocket_id: string;
    financial_period_id: string | null;
  }): Promise<{ id: string }> {
    if (input.amount <= 0) throw new Error("TRANSFER_MUST_BE_POSITIVE");
    const { data, error } = await getSupabase()
      .from("transactions")
      .insert({
        user_id: input.user_id,
        workspace_id: input.workspace_id,
        type: input.type,
        amount: input.amount,
        date: input.date,
        description: input.description,
        account_id: input.account_id,
        pocket_id: input.pocket_id,
        to_account_id: input.to_account_id,
        to_pocket_id: input.to_pocket_id,
        financial_period_id: input.financial_period_id,
        category_id: null,
        spending_nature: "normal",
        affects_budget: false,
        is_onboarding_entry: false,
      })
      .select("id")
      .single();
    if (error) throw error;
    return data as { id: string };
  },

  async listByWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<TransferRow[]> {
    const { data, error } = await getSupabase()
      .from("transactions")
      .select(COLS)
      .eq("user_id", userId)
      .eq("workspace_id", workspaceId)
      .in("type", ["transfer", "emergency_use"])
      .order("date", { ascending: false })
      .order("id", { ascending: false });
    if (error) throw error;
    return (data as TransferRow[]) ?? [];
  },
};
