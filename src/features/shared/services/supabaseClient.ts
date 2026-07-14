/**
 * Único punto de inicialización del SDK de Supabase (ADR-001, ADR-003).
 * Ningún componente React importa este módulo directamente —
 * solo los servicios/repositorios en features/&#42;/services/.
 *
 * Usa exclusivamente la anon/publishable key. Nunca service_role.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && key);

let client: SupabaseClient | null = null;

/** Devuelve el cliente o lanza si el backend aún no está conectado. */
export function getSupabase(): SupabaseClient {
  if (!client) {
    if (!url || !key) {
      throw new Error("SUPABASE_NOT_CONFIGURED");
    }
    client = createClient(url, key);
  }
  return client;
}
