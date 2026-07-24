import { useState } from "react";
import { Input } from "@/features/shared/components/Input";
import { Button } from "@/features/shared/components/Button";
import { Alert } from "@/features/shared/components/Alert";
import { OnboardingSelect } from "@/features/onboarding/components/OnboardingSelect";
import { useToast } from "@/features/shared/components/Toast";
import { useCreatePocket } from "../hooks/useAccountMutations";
import {
  MONEY_STATE_DESCRIPTIONS,
  MONEY_STATE_LABELS,
  formatMoney,
  parseMoneyInput,
  type MoneyState,
} from "../domain/types";

const STATES = (
  ["available", "reserved", "protected", "committed"] as MoneyState[]
).map((v) => ({
  value: v,
  label: `${MONEY_STATE_LABELS[v]} — ${MONEY_STATE_DESCRIPTIONS[v]}`,
}));

interface Props {
  accountId: string;
  currency: string;
  availableInGeneral: number;
  onDone: () => void;
  onCancel: () => void;
}

export function CreatePocketForm({
  accountId,
  currency,
  availableInGeneral,
  onDone,
  onCancel,
}: Props) {
  const [name, setName] = useState("");
  const [state, setState] = useState<MoneyState>("reserved");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const create = useCreatePocket();
  const { toast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Nombre del bolsillo obligatorio.");
    if (name.trim().toLowerCase() === "general")
      return setError('El nombre "General" está reservado.');
    const parsed = parseMoneyInput(amount || "0");
    if (parsed === null) return setError("Monto no válido.");
    if (parsed > availableInGeneral) {
      return setError(
        `Solo hay ${formatMoney(availableInGeneral, currency)} disponibles en General.`,
      );
    }
    try {
      await create.mutateAsync({
        account_id: accountId,
        name: name.trim(),
        money_state: state,
        amount_from_general: parsed,
      });
      toast(`Bolsillo "${name.trim()}" creado.`, "success");
      onDone();
    } catch (err) {
      console.error(err);
      setError("No pudimos crear el bolsillo. Intenta de nuevo.");
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <h4 className="text-base font-semibold text-foreground">
          Nuevo bolsillo
        </h4>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Disponible en General:{" "}
          <strong className="text-foreground tabular-numbers">
            {formatMoney(availableInGeneral, currency)}
          </strong>
        </p>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <Input
        label="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Fondo de emergencia"
      />
      <OnboardingSelect
        label="Estado del dinero"
        options={STATES}
        value={state}
        onChange={(e) => setState(e.target.value as MoneyState)}
      />
      <Input
        label={`Monto a mover desde General (${currency})`}
        type="text"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0"
        helperText="0 = crear vacío. Máximo: el disponible en General."
        className="tabular-numbers"
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button type="submit" loading={create.isPending} className="flex-1">
          Crear bolsillo
        </Button>
      </div>
    </form>
  );
}
