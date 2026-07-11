import { createFileRoute } from "@tanstack/react-router";
import { WelcomeCard } from "@/features/identity/components/WelcomeCard";

export const Route = createFileRoute("/_authenticated/bienvenida")({
  head: () => ({
    meta: [
      { title: "Bienvenida — Finance OS" },
      { name: "description", content: "Tu cuenta y tu workspace personal están listos en Finance OS." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BienvenidaPage,
});

function BienvenidaPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full sm:max-w-[440px]">
        <p className="mb-6 text-center text-sm font-semibold uppercase tracking-widest text-primary">
          Finance OS
        </p>
        <WelcomeCard />
      </div>
    </main>
  );
}
