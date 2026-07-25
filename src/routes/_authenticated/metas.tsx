import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { GoalsScreen } from "@/features/goals/components/GoalsScreen";

export const Route = createFileRoute("/_authenticated/metas")({
  head: () => ({
    meta: [
      { title: "Metas por bolsillo — Finance OS" },
      {
        name: "description",
        content:
          "Configura una meta de ahorro en cualquier bolsillo y sigue tu progreso en vivo.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MetasPage,
});

function MetasPage() {
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
            Metas por bolsillo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ponle un monto objetivo a cualquier bolsillo — como{" "}
            <em>Vacaciones</em> o <em>Fondo de emergencia</em>. El saldo actual
            del bolsillo cuenta desde el primer momento y cada traslado que
            hagas hacia él sube el progreso automáticamente.
          </p>
        </header>
        <GoalsScreen />
      </div>
    </main>
  );
}
