import { Input } from "@/features/shared/components/Input";
import { OnboardingSelect } from "./OnboardingSelect";
import type { OnboardingState } from "../hooks/useOnboardingWizard";

const SOURCE_OPTIONS = [
  { value: "salary", label: "Salario" },
  { value: "freelance", label: "Trabajo independiente" },
  { value: "rental", label: "Arriendo / Renta" },
  { value: "investment_return", label: "Retorno de inversión" },
  { value: "pension", label: "Pensión" },
  { value: "other", label: "Otro" },
];

interface Props {
  value: OnboardingState["income"];
  onChange: (patch: Partial<OnboardingState["income"]>) => void;
}

export function StepIncomeSource({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">Tu ingreso principal</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cuéntanos cuánto recibes en cada período. Podrás agregar más fuentes de
          ingreso más adelante.
        </p>
      </div>
      <Input
        label="Nombre de la fuente"
        value={value.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder="Mi salario"
      />
      <OnboardingSelect
        label="Tipo de ingreso"
        options={SOURCE_OPTIONS}
        value={value.source_type}
        onChange={(e) =>
          onChange({ source_type: e.target.value as OnboardingState["income"]["source_type"] })
        }
      />
      <Input
        label="Monto esperado por período"
        type="number"
        inputMode="decimal"
        min={0}
        step="0.01"
        value={value.expected_amount}
        onChange={(e) => onChange({ expected_amount: e.target.value })}
        placeholder="0"
        className="tabular-nums"
      />
    </div>
  );
}
