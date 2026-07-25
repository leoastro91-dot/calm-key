import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ConfiguracionScreen } from "@/features/configuracion/components/ConfiguracionScreen";

export const Route = createFileRoute("/_authenticated/configuracion")({
  head: () => ({
    meta: [
      { title: "Configuración — Finance OS" },
      {
        name: "description",
        content:
          "Ajusta tu distribución 50/30/20 y las preferencias de tu perfil financiero.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConfiguracionPage,
});

function ConfiguracionPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-8">
      <div className="w-full sm:max-w-[720px]">
        <div className="mb-4 flex items-center justify-between">
          <Link
            to="/bienvenida"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft size={16} aria-hidden /> Volver
          </Link>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Finance OS
          </p>
        </div>
        <header className="mb-5">
          <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajusta tu distribución 50/30/20. Los cambios se reflejan de
            inmediato en el objetivo por bloque de tu presupuesto.
          </p>
        </header>
        <ConfiguracionScreen />
      </div>
    </main>
  );
}
