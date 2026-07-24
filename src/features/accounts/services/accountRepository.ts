/** Repository (ADR-001): accounts — CRUD del feature Cuentas. */
import { getSupabase } from "@/features/shared/services/supabaseClient";
import type { Account, AccountType } from "../domain/types";

const COLS =
  "id, user_id, workspace_id, name, type, currency, opening_balance, current_balance, include_in_total, is_active";

export const accountRepository = {
  async listByWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<Account[]> {
    const { data, error } = await getSupabase()
      .from("accounts")
      .select(COLS)
      .eq("user_id", userId)
      .eq("workspace_id", workspaceId)
      .order("is_active", { ascending: false })
      .order("name", { ascending: true });
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
    include_in_total: boolean;
  }): Promise<Account> {
    const { data, error } = await getSupabase()
      .from("accounts")
      .insert({
        ...input,
        current_balance: input.opening_balance,
        is_active: true,
      })
      .select(COLS)
      .single();
    if (error) throw error;
    return data as Account;
  },

  async update(
    id: string,
    patch: Partial<
      Pick<Account, "name" | "type" | "currency" | "include_in_total">
    >,
  ): Promise<Account> {
    const { data, error } = await getSupabase()
      .from("accounts")
      .update(patch)
      .eq("id", id)
      .select(COLS)
      .single();
    if (error) throw error;
    return data as Account;
  },

  async deactivate(id: string): Promise<void> {
    const { error } = await getSupabase()
      .from("accounts")
      .update({ is_active: false })
      .eq("id", id);
    if (error) throw error;
  },
};
