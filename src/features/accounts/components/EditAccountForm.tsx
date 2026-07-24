import { useState } from "react";
import { Input } from "@/features/shared/components/Input";
import { Button } from "@/features/shared/components/Button";
import { Alert } from "@/features/shared/components/Alert";
import { OnboardingSelect } from "@/features/onboarding/components/OnboardingSelect";
import { useToast } from "@/features/shared/components/Toast";
import { useUpdateAccount } from "../hooks/useAccountMutations";
import { ACCOUNT_TYPE_LABELS } from "../domain/types";
import type { Account, AccountType } from "../domain/types";

const TYPES = (Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((v) => ({
  value: v,
  label: ACCOUNT_TYPE_LABELS[v],
}));

export function EditAccountForm({
  account,
  onDone,
  onCancel,
}: {
  account: Account;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(account.name);
  const [type, setType] = useState<AccountType>(account.type);
  const [currency, setCurrency] = useState(account.currency);
  const [includeInTotal, setIncludeInTotal] = useState(account.include_in_total);
  const [error, setError] = useState<string | null>(null);
  const update = useUpdateAccount();
  const { toast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("El nombre no puede estar vacío.");
    if (currency.trim().length !== 3)
      return setError("Moneda: código ISO de 3 letras.");
    try {
      await update.mutateAsync({
        id: account.id,
        name: name.trim(),
        type,
        currency: currency.toUpperCase(),
        include_in_total: includeInTotal,
      });
      toast("Cuenta actualizada.", "success");
      onDone();
    } catch (err) {
      console.error(err);
      setError("No pudimos guardar los cambios.");
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold text-foreground">Editar cuenta</h3>
      <Alert variant="info">
        El saldo no se edita directamente — se ajusta con movimientos.
      </Alert>
      {error && <Alert variant="error">{error}</Alert>}
      <Input
        label="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
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
        <Button type="submit" loading={update.isPending} className="flex-1">
          Guardar
        </Button>
      </div>
    </form>
  );
}
