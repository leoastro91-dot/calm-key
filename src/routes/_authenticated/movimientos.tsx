import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { MovementsScreen } from "@/features/movements/components/MovementsScreen";

export const Route = createFileRoute("/_authenticated/movimientos")({
  head: () => ({
    meta: [
      { title: "Movimientos internos — Finance OS" },
      {
        name: "description",
        content:
          "Traslada dinero entre tus bolsillos y cuentas manteniendo la trazabilidad de cada movimiento.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MovimientosPage,
});

function MovimientosPage() {
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
          <h1 className="text-2xl font-bold text-foreground">
            Movimientos internos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mueve dinero entre tus bolsillos y cuentas. Si retiras de un
            bolsillo protegido, el movimiento se marcará como uso de emergencia.
          </p>
        </header>
        <MovementsScreen />
      </div>
    </main>
  );
}
