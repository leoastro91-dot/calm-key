import type { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { Spinner } from "@/features/shared/components/Spinner";
import { Card } from "@/features/shared/components/Card";
import { useAuth } from "../hooks/useAuth";

/** Pantalla completa de carga — evita parpadeos hacia /login (Sección 14). */
export function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Spinner size="lg" label="Cargando tu sesión" />
    </div>
  );
}

/**
 * Layout compartido de las pantallas de autenticación: tarjeta centrada,
 * máx. 400px en desktop, ancho completo con padding en mobile.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full sm:max-w-[400px]">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Finance OS
          </p>
          <h1 className="mt-2 text-2xl font-bold leading-8 text-foreground">{title}</h1>
          {subtitle && (
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <Card>{children}</Card>
      </div>
    </main>
  );
}

/**
 * Rutas públicas (/login, /registro): si ya hay sesión activa,
 * redirige a /bienvenida (Sección 6).
 */
export function PublicOnly({ children }: { children: ReactNode }) {
  const { session, isLoading } = useAuth();
  if (isLoading) return <FullScreenLoader />;
  if (session) return <Navigate to="/bienvenida" />;
  return <>{children}</>;
}
