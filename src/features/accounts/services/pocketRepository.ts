/** Repository (ADR-001): pockets — CRUD del feature Cuentas. */
import { getSupabase } from "@/features/shared/services/supabaseClient";
import type { MoneyState, Pocket } from "../domain/types";
import { GENERAL_POCKET_NAME } from "../domain/types";

const COLS =
  "id, account_id, user_id, workspace_id, name, money_state, balance, is_active, target_amount";

export const pocketRepository = {
  async listByWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<Pocket[]> {
    const { data, error } = await getSupabase()
      .from("pockets")
      .select(COLS)
      .eq("user_id", userId)
      .eq("workspace_id", workspaceId)
      .order("is_active", { ascending: false })
      .order("name", { ascending: true });
    if (error) throw error;
    return (data as Pocket[]) ?? [];
  },

  async getGeneralByAccount(accountId: string): Promise<Pocket | null> {
    const { data, error } = await getSupabase()
      .from("pockets")
      .select(COLS)
      .eq("account_id", accountId)
      .eq("name", GENERAL_POCKET_NAME)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw error;
    return (data as Pocket) ?? null;
  },

  async create(input: {
    account_id: string;
    user_id: string;
    workspace_id: string;
    name: string;
    money_state: MoneyState;
    balance: number;
  }): Promise<Pocket> {
    const { data, error } = await getSupabase()
      .from("pockets")
      .insert({ ...input, is_active: true })
      .select(COLS)
      .single();
    if (error) throw error;
    return data as Pocket;
  },

  async update(
    id: string,
    patch: Partial<Pick<Pocket, "name" | "money_state">>,
  ): Promise<Pocket> {
    const { data, error } = await getSupabase()
      .from("pockets")
      .update(patch)
      .eq("id", id)
      .select(COLS)
      .single();
    if (error) throw error;
    return data as Pocket;
  },

  async setBalance(id: string, balance: number): Promise<void> {
    const { data, error } = await getSupabase()
      .from("pockets")
      .update({ balance })
      .eq("id", id)
      .select("id, balance");
    if (error) throw error;
    // Si RLS o un id inválido impiden el UPDATE, Supabase devuelve 0 filas
    // sin error: eso dejaría el dinero sin moverse en silencio.
    if (!data || data.length === 0) {
      throw new Error("POCKET_BALANCE_UPDATE_FAILED");
    }
  },

  async updateTarget(id: string, target_amount: number | null): Promise<Pocket> {
    const { data, error } = await getSupabase()
      .from("pockets")
      .update({ target_amount })
      .eq("id", id)
      .select(COLS)
      .single();
    if (error) throw error;
    return data as Pocket;
  },

  async deactivate(id: string): Promise<void> {
    const { error } = await getSupabase()
      .from("pockets")
      .update({ is_active: false })
      .eq("id", id);
    if (error) throw error;
  },
};
