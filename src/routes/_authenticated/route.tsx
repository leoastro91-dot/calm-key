/**
 * Capa de protección de rutas.
 *
 * IMPORTANTE (ADR-002): este gate es una capa de EXPERIENCIA, no de seguridad.
 * La seguridad real la garantiza RLS en la base de datos — aunque un usuario
 * llegara a renderizar una ruta protegida sin sesión, ninguna consulta
 * devolvería datos ajenos.
 *
 * ssr: false — la sesión vive en el cliente (SDK de Supabase); el servidor
 * no puede verificarla, y hacerlo causaría bucles de redirección al recargar.
 */
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { authService } from "@/features/identity/services/authService";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const user = await authService.getUser();
    if (!user) throw redirect({ to: "/login" });
    return { user };
  },
  component: () => <Outlet />,
});
