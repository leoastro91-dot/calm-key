import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { DashboardScreen } from "@/features/dashboard/components/DashboardScreen";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Finance OS" },
      {
        name: "description",
        content:
          "Tu situación financiera del período de un vistazo: patrimonio, estados del dinero, presupuesto, gastos y deudas.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
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
          <h1 className="text-2xl font-bold text-foreground">Tu dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Un solo lugar para ver tu situación financiera del período: sin
            escribir nada, solo entender dónde estás parado.
          </p>
        </header>
        <DashboardScreen />
      </div>
    </main>
  );
}
