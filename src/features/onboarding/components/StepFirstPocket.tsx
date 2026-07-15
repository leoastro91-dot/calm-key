import { Input } from "@/features/shared/components/Input";
import { OnboardingSelect } from "./OnboardingSelect";
import type { OnboardingState } from "../hooks/useOnboardingWizard";

const MONEY_STATES = [
  { value: "available", label: "Disponible — puedo gastarlo" },
  { value: "reserved", label: "Reservado — para un plan cercano" },
  { value: "protected", label: "Protegido — no lo toco" },
  { value: "committed", label: "Comprometido — tiene un destino" },
];

interface Props {
  value: OnboardingState["pocket"];
  currency: string;
  onChange: (patch: Partial<OnboardingState["pocket"]>) => void;
}

export function StepFirstPocket({ value, currency, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">
          ¿Quieres crear tu primer bolsillo?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Un bolsillo separa una parte del dinero de tu cuenta con un propósito
          claro. Es opcional — puedes omitir este paso y crearlos después.
        </p>
      </div>
      <Input
        label="Nombre del bolsillo"
        value={value.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder="Fondo de emergencia"
      />
      <OnboardingSelect
        label="Estado del dinero"
        options={MONEY_STATES}
        value={value.money_state}
        onChange={(e) =>
          onChange({ money_state: e.target.value as OnboardingState["pocket"]["money_state"] })
        }
      />
      <Input
        label={`Saldo inicial (${currency})`}
        type="number"
        inputMode="decimal"
        min={0}
        step="0.01"
        value={value.balance}
        onChange={(e) => onChange({ balance: e.target.value })}
        helperText="Puede ser 0 si el bolsillo nace vacío."
        className="tabular-nums"
      />
    </div>
  );
}
