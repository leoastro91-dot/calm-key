import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { FullScreenLoader } from "@/features/identity/components/AuthLayout";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Finance OS — Planeación financiera personal" },
      { name: "description", content: "Plataforma de planeación financiera personal y colaborativa. Privada, segura y bajo tu control." },
      { property: "og:title", content: "Finance OS — Planeación financiera personal" },
      { property: "og:description", content: "Plataforma de planeación financiera personal y colaborativa." },
    ],
  }),
  component: Index,
});

// La raíz solo decide destino según la sesión (Sección 6 del flujo).
function Index() {
  const { session, isLoading } = useAuth();
  if (isLoading) return <FullScreenLoader />;
  return session ? <Navigate to="/bienvenida" /> : <Navigate to="/login" />;
}
