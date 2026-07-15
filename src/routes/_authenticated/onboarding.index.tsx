import { createFileRoute } from "@tanstack/react-router";
import { OnboardingWizard } from "@/features/onboarding/components/OnboardingWizard";

export const Route = createFileRoute("/_authenticated/onboarding/")({
  head: () => ({
    meta: [
      { title: "Configura tu perfil financiero — Finance OS" },
      {
        name: "description",
        content:
          "Configura tu ingreso, tu distribución 50/30/20, tu ciclo financiero y tu primera cuenta.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-8">
      <div className="w-full sm:max-w-[560px]">
        <p className="mb-6 text-center text-sm font-semibold uppercase tracking-widest text-primary">
          Finance OS
        </p>
        <OnboardingWizard />
      </div>
    </main>
  );
}
