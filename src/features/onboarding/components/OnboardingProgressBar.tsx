import { cn } from "@/lib/utils";
import { TOTAL_STEPS } from "../hooks/useOnboardingWizard";

const STEP_NAMES = [
  "Ingreso principal",
  "Distribución",
  "Ciclo financiero",
  "Primera cuenta",
  "Primer bolsillo",
  "Confirmación",
];

export function OnboardingProgressBar({ current }: { current: number }) {
  return (
    <nav
      aria-label="Progreso del onboarding"
      className="flex flex-col gap-2"
    >
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>
          Paso {current} de {TOTAL_STEPS}
        </span>
        <span className="text-foreground">{STEP_NAMES[current - 1]}</span>
      </div>
      <ol className="flex gap-1.5" role="list">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
          const idx = i + 1;
          const active = idx === current;
          const done = idx < current;
          return (
            <li
              key={idx}
              aria-current={active ? "step" : undefined}
              aria-label={`Paso ${idx} de ${TOTAL_STEPS}: ${STEP_NAMES[i]}`}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                done || active ? "bg-primary" : "bg-muted",
              )}
            />
          );
        })}
      </ol>
    </nav>
  );
}
