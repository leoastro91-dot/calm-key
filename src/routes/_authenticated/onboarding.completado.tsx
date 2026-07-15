import { createFileRoute } from "@tanstack/react-router";
import { OnboardingSuccessScreen } from "@/features/onboarding/components/OnboardingSuccessScreen";

export const Route = createFileRoute("/_authenticated/onboarding/completado")({
  head: () => ({
    meta: [
      { title: "¡Todo listo! — Finance OS" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CompletadoPage,
});

function CompletadoPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full sm:max-w-[440px]">
        <p className="mb-6 text-center text-sm font-semibold uppercase tracking-widest text-primary">
          Finance OS
        </p>
        <OnboardingSuccessScreen />
      </div>
    </main>
  );
}
