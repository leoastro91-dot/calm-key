/**
 * Repository Pattern (ADR-001): acceso tipado a public.profiles vía PostgREST.
 * RLS garantiza el aislamiento — el frontend nunca filtra por seguridad.
 */
import { getSupabase } from "@/features/shared/services/supabaseClient";
import type { Profile } from "../domain/types";

export const profileRepository = {
  async getById(id: string): Promise<Profile | null> {
    const { data, error } = await getSupabase()
      .from("profiles")
      .select("id, full_name, currency, timezone, account_status, created_at")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data as Profile) ?? null;
  },

  /**
   * INSERT mínimo tras signUp: solo el id; el resto usa los DEFAULT de la tabla.
   * El trigger on_profile_created crea workspace + workspace_member (backend).
   */
  async create(input: { id: string }): Promise<void> {
    const { error } = await getSupabase().from("profiles").insert({ id: input.id });
    if (error) throw error;
  },
};
