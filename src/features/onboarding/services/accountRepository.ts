/** Repository (ADR-001): accounts. */
import { getSupabase } from "@/features/shared/services/supabaseClient";
import type { Account, AccountType } from "../domain/types";

const COLS =
  "id, user_id, workspace_id, name, type, currency, opening_balance, current_balance, include_in_total, is_active";

export const accountRepository = {
  async listByUser(userId: string, workspaceId: string): Promise<Account[]> {
    const { data, error } = await getSupabase()
      .from("accounts")
      .select(COLS)
      .eq("user_id", userId)
      .eq("workspace_id", workspaceId);
    if (error) throw error;
    return (data as Account[]) ?? [];
  },

  async create(input: {
    user_id: string;
    workspace_id: string;
    name: string;
    type: AccountType;
    currency: string;
    opening_balance: number;
  }): Promise<Account> {
    const { data, error } = await getSupabase()
      .from("accounts")
      .insert({
        ...input,
        current_balance: input.opening_balance,
        include_in_total: true,
        is_active: true,
      })
      .select(COLS)
      .single();
    if (error) throw error;
    return data as Account;
  },
};
