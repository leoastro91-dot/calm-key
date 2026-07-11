/**
 * AuthContext global (LOVABLE-001, Sección 14).
 * Expone user, session, isLoading, signOut.
 *
 * Flujo crítico (Sección 12): el INSERT en profiles se ejecuta ÚNICAMENTE
 * dentro del callback onAuthStateChange con event === 'SIGNED_IN', nunca
 * inmediatamente después de signUp(). El trigger on_profile_created (backend)
 * crea el workspace automáticamente tras ese INSERT.
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { authService, isSupabaseConfigured } from "../services/authService";
import { profileRepository } from "../services/profileRepository";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}

/** Alias semántico: acceso solo a la sesión. */
export function useSession() {
  const { session, isLoading } = useAuth();
  return { session, isLoading };
}

async function ensureProfile(userId: string) {
  try {
    const existing = await profileRepository.getById(userId);
    if (!existing) {
      await profileRepository.create({ id: userId });
    }
  } catch (err) {
    // Caso borde manejado en /bienvenida con reintento (Sección 16).
    console.error("No se pudo asegurar el perfil:", err);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    const { unsubscribe } = authService.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setIsLoading(false);
      if (event === "SIGNED_IN" && newSession?.user) {
        // setTimeout evita deadlocks dentro del callback del SDK.
        const uid = newSession.user.id;
        setTimeout(() => void ensureProfile(uid), 0);
      }
    });

    authService.getSession().then((s) => {
      setSession(s);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    await authService.signOut();
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{ user: session?.user ?? null, session, isLoading, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
