import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { IncomeScreen } from "@/features/income/components/IncomeScreen";

export const Route = createFileRoute("/_authenticated/ingresos")({
  head: () => ({
    meta: [
      { title: "Ingresos del período — Finance OS" },
      {
        name: "description",
        content:
          "Registra tus ingresos reales del período activo y mantén al día tu avance financiero.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: IngresosPage,
});

function IngresosPage() {
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
            Ingresos del período
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registra el salario y otros ingresos que entren en el período
            activo. Cada ingreso actualiza el bolsillo y la cuenta destino.
          </p>
        </header>
        <IncomeScreen />
      </div>
    </main>
  );
}
