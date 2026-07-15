import { Input } from "@/features/shared/components/Input";
import { OnboardingSelect } from "./OnboardingSelect";
import type { OnboardingState } from "../hooks/useOnboardingWizard";

const ACCOUNT_TYPES = [
  { value: "savings", label: "Cuenta de ahorros" },
  { value: "checking", label: "Cuenta corriente" },
  { value: "digital_wallet", label: "Billetera digital" },
  { value: "cash", label: "Efectivo" },
  { value: "investment", label: "Inversión" },
  { value: "credit", label: "Crédito" },
];

interface Props {
  value: OnboardingState["account"];
  onChange: (patch: Partial<OnboardingState["account"]>) => void;
}

export function StepFirstAccount({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">Tu primera cuenta</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Registra una cuenta donde tengas tu dinero hoy. Podrás agregar más
          cuentas más adelante.
        </p>
      </div>
      <Input
        label="Nombre de la cuenta"
        value={value.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder="Cuenta principal"
      />
      <OnboardingSelect
        label="Tipo de cuenta"
        options={ACCOUNT_TYPES}
        value={value.type}
        onChange={(e) =>
          onChange({ type: e.target.value as OnboardingState["account"]["type"] })
        }
      />
      <Input
        label="Moneda"
        value={value.currency}
        onChange={(e) => onChange({ currency: e.target.value.toUpperCase() })}
        maxLength={3}
        helperText="Código ISO de 3 letras (ej: COP, USD, EUR)."
      />
      <Input
        label={`Saldo actual (${value.currency})`}
        type="number"
        inputMode="decimal"
        min={0}
        step="0.01"
        value={value.opening_balance}
        onChange={(e) => onChange({ opening_balance: e.target.value })}
        helperText="Puedes empezar en 0 si aún no tienes saldo aquí."
        className="tabular-nums"
      />
    </div>
  );
}
