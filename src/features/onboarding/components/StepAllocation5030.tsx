import { PercentageSplitInput } from "@/features/shared/components/PercentageSplitInput";
import type { OnboardingState } from "../hooks/useOnboardingWizard";

interface Props {
  value: OnboardingState["allocation"];
  onChange: (patch: Partial<OnboardingState["allocation"]>) => void;
  sum: number;
}

export function StepAllocation5030({ value, onChange, sum }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">
          ¿Cómo quieres distribuir tu dinero?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          La regla 50/30/20 es una referencia inicial. Ajústala a tu realidad —
          los tres bloques deben sumar 100%.
        </p>
      </div>
      <PercentageSplitInput values={value} onChange={onChange} sum={sum} />
    </div>
  );
}
