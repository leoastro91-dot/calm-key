import { Input } from "@/features/shared/components/Input";
import { OnboardingSelect } from "./OnboardingSelect";
import type { OnboardingState } from "../hooks/useOnboardingWizard";

const PERIOD_OPTIONS = [
  { value: "monthly", label: "Mensual" },
  { value: "biweekly", label: "Quincenal" },
  { value: "weekly", label: "Semanal" },
  { value: "custom", label: "Personalizado" },
];

interface Props {
  value: OnboardingState["cycle"];
  onChange: (patch: Partial<OnboardingState["cycle"]>) => void;
}

export function StepFinancialCycle({ value, onChange }: Props) {
  const t = value.period_type;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">Tu ciclo financiero</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Es el período en el que planeas y revisas tu dinero. Puedes cambiarlo
          después si tu vida cambia.
        </p>
      </div>
      <OnboardingSelect
        label="Tipo de período"
        options={PERIOD_OPTIONS}
        value={t}
        onChange={(e) =>
          onChange({ period_type: e.target.value as OnboardingState["cycle"]["period_type"] })
        }
      />
      {(t === "monthly" || t === "biweekly") && (
        <Input
          label="Día de inicio del ciclo"
          type="number"
          inputMode="numeric"
          min={1}
          max={31}
          value={value.period_cycle_start_day}
          onChange={(e) => onChange({ period_cycle_start_day: e.target.value })}
          helperText="Entre 1 y 31. Usaremos este día para períodos futuros."
        />
      )}
      {t === "custom" && (
        <>
          <Input
            label="Fecha de inicio"
            type="date"
            value={value.custom_start_date}
            onChange={(e) => onChange({ custom_start_date: e.target.value })}
          />
          <Input
            label="Fecha de fin"
            type="date"
            value={value.custom_end_date}
            onChange={(e) => onChange({ custom_end_date: e.target.value })}
          />
        </>
      )}
    </div>
  );
}
