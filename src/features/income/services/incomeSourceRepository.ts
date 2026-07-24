/**
 * Repository (ADR-001) — income_sources: reutilización case-insensitive
 * y listado para el selector.
 */
import { getSupabase } from "@/features/shared/services/supabaseClient";
import type { IncomeSource, IncomeSourceType } from "../domain/types";

const COLS =
  "id, user_id, workspace_id, name, source_type, expected_amount, is_primary, is_active";

export const incomeSourceRepository = {
  async listByWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<IncomeSource[]> {
    const { data, error } = await getSupabase()
      .from("income_sources")
      .select(COLS)
      .eq("user_id", userId)
      .eq("workspace_id", workspaceId)
      .eq("is_active", true)
      .order("is_primary", { ascending: false })
      .order("name", { ascending: true });
    if (error) throw error;
    return (data as IncomeSource[]) ?? [];
  },

  async getPrimary(
    userId: string,
    workspaceId: string,
  ): Promise<IncomeSource | null> {
    const { data, error } = await getSupabase()
      .from("income_sources")
      .select(COLS)
      .eq("user_id", userId)
      .eq("workspace_id", workspaceId)
      .eq("is_primary", true)
      .maybeSingle();
    if (error) throw error;
    return (data as IncomeSource) ?? null;
  },

  /**
   * Busca por nombre case-insensitive; si no existe, crea una fuente
   * secundaria (is_primary=false) con el tipo indicado.
   */
  async findByNameOrCreate(input: {
    user_id: string;
    workspace_id: string;
    name: string;
    source_type: IncomeSourceType;
  }): Promise<IncomeSource> {
    const trimmed = input.name.trim();
    const { data: existing, error: exErr } = await getSupabase()
      .from("income_sources")
      .select(COLS)
      .eq("user_id", input.user_id)
      .eq("workspace_id", input.workspace_id)
      .ilike("name", trimmed)
      .maybeSingle();
    if (exErr) throw exErr;
    if (existing) return existing as IncomeSource;

    const { data, error } = await getSupabase()
      .from("income_sources")
      .insert({
        user_id: input.user_id,
        workspace_id: input.workspace_id,
        name: trimmed,
        source_type: input.source_type,
        expected_amount: 0,
        is_primary: false,
        is_active: true,
      })
      .select(COLS)
      .single();
    if (error) throw error;
    return data as IncomeSource;
  },
};
