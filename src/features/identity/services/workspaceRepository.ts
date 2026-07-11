/**
 * Repository Pattern (ADR-001): acceso tipado a public.workspaces (solo lectura).
 */
import { getSupabase } from "@/features/shared/services/supabaseClient";
import type { Workspace } from "../domain/types";

export const workspaceRepository = {
  async getByOwnerId(ownerId: string): Promise<Workspace | null> {
    const { data, error } = await getSupabase()
      .from("workspaces")
      .select("id, name, owner_id")
      .eq("owner_id", ownerId)
      .maybeSingle();
    if (error) throw error;
    return (data as Workspace) ?? null;
  },
};
