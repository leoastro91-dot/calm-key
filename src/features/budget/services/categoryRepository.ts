/**
 * Repository (ADR-001) — categories. Lee catálogo del sistema y las del
 * usuario/workspace. No crea categorías (fuera de alcance de LOVABLE-006).
 */
import { getSupabase } from "@/features/shared/services/supabaseClient";
import type { Block5030, Category } from "../domain/types";

const COLS =
  "id, user_id, workspace_id, name, block_5030, is_system, icon";

export const categoryRepository = {
  /** Todas las categorías disponibles para este usuario: sistema + propias. */
  async listAvailable(
    userId: string,
    workspaceId: string,
  ): Promise<Category[]> {
    const { data, error } = await getSupabase()
      .from("categories")
      .select(COLS)
      .or(`is_system.eq.true,and(user_id.eq.${userId},workspace_id.eq.${workspaceId})`)
      .order("block_5030", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Category[];
  },

  /** Agrupa categorías por bloque 50/30/20. */
  groupByBlock(categories: Category[]): Record<Block5030, Category[]> {
    const result: Record<Block5030, Category[]> = {
      needs: [],
      wants: [],
      construction: [],
    };
    for (const c of categories) {
      result[c.block_5030]?.push(c);
    }
    return result;
  },
};
