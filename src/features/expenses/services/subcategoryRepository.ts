/**
 * Repository (ADR-001) — subcategories.
 * RLS filtra las que el usuario puede ver (sistema + propias).
 * No crea subcategorías (fuera de alcance de LOVABLE-007).
 */
import { getSupabase } from "@/features/shared/services/supabaseClient";
import type { Subcategory } from "../domain/types";

const COLS = "id, category_id, name";

export const subcategoryRepository = {
  async listAll(): Promise<Subcategory[]> {
    const { data, error } = await getSupabase()
      .from("subcategories")
      .select(COLS)
      .order("name", { ascending: true });
    if (error) {
      // Si la tabla no está expuesta o no hay permisos, el campo es opcional:
      // devolvemos vacío para no bloquear el formulario de gasto.
      console.warn("subcategories no disponibles:", error.message);
      return [];
    }
    return (data as Subcategory[]) ?? [];
  },
};
