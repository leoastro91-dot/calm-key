import { useState } from "react";
import { Input } from "@/features/shared/components/Input";
import { Button } from "@/features/shared/components/Button";
import { Alert } from "@/features/shared/components/Alert";
import { OnboardingSelect } from "@/features/onboarding/components/OnboardingSelect";
import { useToast } from "@/features/shared/components/Toast";
import { useCreateAccount } from "../hooks/useAccountMutations";
import { ACCOUNT_TYPE_LABELS, parseMoneyInput } from "../domain/types";
import type { AccountType } from "../domain/types";

const TYPES = (Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((v) => ({
  value: v,
  label: ACCOUNT_TYPE_LABELS[v],
}));

export function CreateAccountForm({
  defaultCurrency,
  onDone,
  onCancel,
}: {
  defaultCurrency: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("digital_wallet");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [balance, setBalance] = useState("");
  const [includeInTotal, setIncludeInTotal] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const create = useCreateAccount();
  const { toast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Ponle un nombre a la cuenta.");
    if (currency.trim().length !== 3)
      return setError("La moneda debe ser el código ISO de 3 letras (ej: COP).");
    const amount = parseMoneyInput(balance || "0");
    if (amount === null) return setError("Saldo no válido.");
    try {
      await create.mutateAsync({
        name: name.trim(),
        type,
        currency: currency.toUpperCase(),
        opening_balance: amount,
        include_in_total: includeInTotal,
      });
      toast(`Cuenta "${name.trim()}" creada.`, "success");
      onDone();
    } catch (err) {
      console.error(err);
      setError("No pudimos crear la cuenta. Intenta de nuevo.");
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Nueva cuenta</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Se creará automáticamente un bolsillo <strong>General</strong> con el
          saldo total. Podrás mover dinero a bolsillos adicionales después.
        </p>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <Input
        label="Nombre de la cuenta"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Rappi, Nequi, Efectivo…"
      />
      <OnboardingSelect
        label="Tipo"
        options={TYPES}
        value={type}
        onChange={(e) => setType(e.target.value as AccountType)}
      />
      <Input
        label="Moneda"
        value={currency}
        onChange={(e) => setCurrency(e.target.value.toUpperCase())}
        maxLength={3}
        helperText="Código ISO de 3 letras."
      />
      <Input
        label={`Saldo actual (${currency})`}
        type="text"
        inputMode="decimal"
        value={balance}
        onChange={(e) => setBalance(e.target.value)}
        placeholder="0"
        helperText="Puede ser 0. Acepta '1.234,56' o '1234.56'."
        className="tabular-numbers"
      />
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={includeInTotal}
          onChange={(e) => setIncludeInTotal(e.target.checked)}
          className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
        />
        Incluir en el patrimonio total
      </label>
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
          Crear cuenta
        </Button>
      </div>
    </form>
  );
}
