/**
 * Wrapper sobre Supabase Auth (ADR-001).
 * Los componentes nunca llaman a supabase.auth directamente.
 */
import type { Session, User, AuthChangeEvent } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "@/features/shared/services/supabaseClient";

export { isSupabaseConfigured };

const NOT_CONFIGURED_MSG =
  "El backend aún no está conectado. Conecta Supabase desde la configuración del proyecto.";

/** Traduce errores de Supabase Auth a mensajes claros en español. */
export function mapAuthError(error: unknown): string {
  const msg =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (msg === "SUPABASE_NOT_CONFIGURED") return NOT_CONFIGURED_MSG;
  const m = msg.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Ya existe una cuenta con este correo. ¿Quieres iniciar sesión?";
  if (m.includes("invalid login credentials"))
    return "Correo o contraseña incorrectos.";
  if (m.includes("email not confirmed"))
    return "Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.";
  if (m.includes("password should be at least"))
    return "La contraseña no cumple la política mínima de seguridad.";
  if (
    m.includes("network") ||
    m.includes("fetch") ||
    m.includes("timeout") ||
    m.includes("failed to fetch")
  )
    return "No pudimos conectar. Verifica tu conexión e inténtalo de nuevo.";
  return "Ocurrió un error inesperado. Inténtalo de nuevo.";
}

export const authService = {
  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await getSupabase().auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await getSupabase().auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await getSupabase().auth.signOut();
    if (error) throw error;
  },

  async requestPasswordReset(email: string) {
    const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/actualizar-password`,
    });
    if (error) throw error;
  },

  async updatePassword(newPassword: string) {
    const { error } = await getSupabase().auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  async getSession(): Promise<Session | null> {
    if (!isSupabaseConfigured) return null;
    const { data } = await getSupabase().auth.getSession();
    return data.session;
  },

  async getUser(): Promise<User | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await getSupabase().auth.getUser();
    if (error) return null;
    return data.user;
  },

  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void,
  ) {
    if (!isSupabaseConfigured) return { unsubscribe: () => {} };
    const { data } = getSupabase().auth.onAuthStateChange(callback);
    return { unsubscribe: () => data.subscription.unsubscribe() };
  },
};
