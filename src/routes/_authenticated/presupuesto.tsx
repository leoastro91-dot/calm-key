import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { BudgetScreen } from "@/features/budget/components/BudgetScreen";

export const Route = createFileRoute("/_authenticated/presupuesto")({
  head: () => ({
    meta: [
      { title: "Presupuesto del período — Finance OS" },
      {
        name: "description",
        content:
          "Planea cuánto proyectas gastar por categoría en tu período activo y compáralo con tu meta 50/30/20.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PresupuestoPage,
});

function PresupuestoPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-8">
      <div className="w-full sm:max-w-[900px]">
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
            Presupuesto del período
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Define cuánto proyectas gastar por categoría este período. La
            ejecución real llegará con el registro de gastos.
          </p>
        </header>
        <BudgetScreen />
      </div>
    </main>
  );
}
