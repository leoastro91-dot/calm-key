import { useMemo, useState } from "react";
import { Input } from "@/features/shared/components/Input";
import { Button } from "@/features/shared/components/Button";
import { Alert } from "@/features/shared/components/Alert";
import { OnboardingSelect } from "@/features/onboarding/components/OnboardingSelect";
import { useToast } from "@/features/shared/components/Toast";
import { toISODate } from "@/features/onboarding/domain/types";
import { parseMoneyInput } from "@/features/accounts/domain/types";
import type { Account, Pocket } from "@/features/accounts/domain/types";
import {
  OTHER_INCOME_TYPE_OPTIONS,
  formatPeriodRange,
  isDateInRange,
  type ActivePeriod,
  type IncomeSource,
  type IncomeSourceType,
} from "../domain/types";
import { useRegisterIncome } from "../hooks/useRegisterIncome";

interface Props {
  period: ActivePeriod;
  primarySource: IncomeSource | null;
  accounts: Account[];
  pockets: Pocket[];
  onDone: () => void;
  onCancel: () => void;
}

type Kind = "primary" | "other";

export function RegisterIncomeForm({
  period,
  primarySource,
  accounts,
  pockets,
  onDone,
  onCancel,
}: Props) {
  const defaultKind: Kind = primarySource ? "primary" : "other";
  const [kind, setKind] = useState<Kind>(defaultKind);
  const [otherName, setOtherName] = useState("");
  const [otherType, setOtherType] = useState<IncomeSourceType>("freelance");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(toISODate(new Date()));
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const initialPockets = pockets.filter((p) => p.account_id === accountId);
  const defaultPocket =
    initialPockets.find((p) => p.name === "General") ?? initialPockets[0];
  const [pocketId, setPocketId] = useState(defaultPocket?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const register = useRegisterIncome();
  const { toast } = useToast();

  const accountOptions = accounts.map((a) => ({ value: a.id, label: a.name }));
  const pocketOptions = useMemo(
    () =>
      pockets
        .filter((p) => p.account_id === accountId)
        .map((p) => ({ value: p.id, label: p.name })),
    [pockets, accountId],
  );

  const onChangeAccount = (id: string) => {
    setAccountId(id);
    const available = pockets.filter((p) => p.account_id === id);
    const gen = available.find((p) => p.name === "General") ?? available[0];
    setPocketId(gen?.id ?? "");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = parseMoneyInput(amount);
    if (parsed === null || parsed <= 0) {
      return setError("Ingresa un monto mayor a cero.");
    }
    if (!accountId || !pocketId) {
      return setError("Elige la cuenta y el bolsillo destino.");
    }
    if (!isDateInRange(date, period.start_date, period.end_date)) {
      return setError(
        `La fecha debe estar dentro del período activo (${formatPeriodRange(period.start_date, period.end_date)}).`,
      );
    }
    if (kind === "other" && !otherName.trim()) {
      return setError("Escribe un nombre para este ingreso.");
    }
    if (kind === "primary" && !primarySource) {
      return setError("No tienes una fuente principal configurada.");
    }

    try {
      await register.mutateAsync(
        kind === "primary"
          ? {
              kind: "primary",
              amount: parsed,
              date,
              account_id: accountId,
              pocket_id: pocketId,
              period,
            }
          : {
              kind: "other",
              name: otherName.trim(),
              source_type: otherType,
              amount: parsed,
              date,
              account_id: accountId,
              pocket_id: pocketId,
              period,
            },
      );
      toast("Ingreso registrado.", "success");
      onDone();
    } catch (err) {
      console.error(err);
      setError("No pudimos registrar el ingreso. Intenta de nuevo.");
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">
          Registrar ingreso
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Período activo: {formatPeriodRange(period.start_date, period.end_date)}
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-foreground">
          Tipo de ingreso
        </legend>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-input bg-card p-3 has-[:checked]:border-primary has-[:checked]:bg-accent/50">
          <input
            type="radio"
            name="income-kind"
            className="mt-1"
            checked={kind === "primary"}
            disabled={!primarySource}
            onChange={() => setKind("primary")}
          />
          <span className="text-sm">
            <span className="block font-medium text-foreground">
              Mi salario
              {primarySource && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({primarySource.name})
                </span>
              )}
            </span>
            <span className="text-xs text-muted-foreground">
              {primarySource
                ? "Usa tu fuente principal ya configurada."
                : "Aún no tienes una fuente principal — completa el onboarding."}
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-input bg-card p-3 has-[:checked]:border-primary has-[:checked]:bg-accent/50">
          <input
            type="radio"
            name="income-kind"
            className="mt-1"
            checked={kind === "other"}
            onChange={() => setKind("other")}
          />
          <span className="text-sm">
            <span className="block font-medium text-foreground">
              Otro ingreso
            </span>
            <span className="text-xs text-muted-foreground">
              Freelance, arriendo, retorno de inversión, etc.
            </span>
          </span>
        </label>
      </fieldset>

      {kind === "other" && (
        <>
          <Input
            label="Nombre del ingreso"
            value={otherName}
            onChange={(e) => setOtherName(e.target.value)}
            placeholder="Freelance diseño"
          />
          <OnboardingSelect
            label="Tipo"
            options={OTHER_INCOME_TYPE_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            value={otherType}
            onChange={(e) => setOtherType(e.target.value as IncomeSourceType)}
          />
        </>
      )}

      <Input
        label="Monto recibido"
        type="text"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0"
        className="tabular-numbers"
      />

      <Input
        label="Fecha"
        type="date"
        value={date}
        min={period.start_date}
        max={period.end_date}
        onChange={(e) => setDate(e.target.value)}
      />

      <OnboardingSelect
        label="Cuenta destino"
        options={accountOptions}
        value={accountId}
        onChange={(e) => onChangeAccount(e.target.value)}
      />

      <OnboardingSelect
        label="Bolsillo destino"
        options={pocketOptions}
        value={pocketId}
        onChange={(e) => setPocketId(e.target.value)}
        helperText="Por defecto entra al bolsillo General."
      />

      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={register.isPending}
          className="flex-1"
        >
          Registrar ingreso
        </Button>
      </div>
    </form>
  );
}
