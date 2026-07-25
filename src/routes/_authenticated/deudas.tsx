import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { DebtsScreen } from "@/features/debts/components/DebtsScreen";

export const Route = createFileRoute("/_authenticated/deudas")({
  head: () => ({
    meta: [
      { title: "Mis deudas — Finance OS" },
      {
        name: "description",
        content:
          "Registra tus deudas y monitorea el saldo pendiente. Cada abono descuenta de tu cuenta y de la deuda.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DeudasPage,
});

function DeudasPage() {
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
          <h1 className="text-2xl font-bold text-foreground">Mis deudas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registra a quién le debes y abona desde cualquier cuenta. El saldo
            de la deuda baja según tu abono a capital; el interés (si lo hay)
            se refleja como salida de tu cuenta.
          </p>
        </header>
        <DebtsScreen />
      </div>
    </main>
  );
}
