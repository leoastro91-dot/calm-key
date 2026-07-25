/** Repository (ADR-001): pockets. */
import { getSupabase } from "@/features/shared/services/supabaseClient";
import type { MoneyState, Pocket } from "../domain/types";

const COLS =
  "id, account_id, user_id, workspace_id, name, money_state, balance, is_active, target_amount";

export const pocketRepository = {
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
};
