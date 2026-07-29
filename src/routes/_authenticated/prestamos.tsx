import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { LoansScreen } from "@/features/loans/components/LoansScreen";

export const Route = createFileRoute("/_authenticated/prestamos")({
  head: () => ({
    meta: [
      { title: "Préstamos a terceros — Finance OS" },
      {
        name: "description",
        content:
          "Registra el dinero que le prestas a otras personas, de qué bolsillo salió y cuándo regresa.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PrestamosPage,
});

function PrestamosPage() {
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
            Préstamos a terceros
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Dinero que le prestaste a alguien más. Sale del bolsillo que elijas
            y vuelve al bolsillo que indiques cuando te lo devuelvan. No afecta
            tu presupuesto.
          </p>
        </header>
        <LoansScreen />
      </div>
    </main>
  );
}
