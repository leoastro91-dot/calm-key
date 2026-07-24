import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AccountsScreen } from "@/features/accounts/components/AccountsScreen";

export const Route = createFileRoute("/_authenticated/cuentas")({
  head: () => ({
    meta: [
      { title: "Mis cuentas y bolsillos — Finance OS" },
      {
        name: "description",
        content:
          "Registra tus cuentas y organiza tu dinero en bolsillos con propósito.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CuentasPage,
});

function CuentasPage() {
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
            Mis cuentas y bolsillos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada cuenta tiene un bolsillo <strong>General</strong> automático.
            Todo bolsillo adicional se financia moviendo dinero desde General.
          </p>
        </header>
        <AccountsScreen />
      </div>
    </main>
  );
}
