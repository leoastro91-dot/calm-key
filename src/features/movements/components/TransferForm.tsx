import { useMemo, useState } from "react";
import { Input } from "@/features/shared/components/Input";
import { Button } from "@/features/shared/components/Button";
import { Alert } from "@/features/shared/components/Alert";
import { useToast } from "@/features/shared/components/Toast";
import { toISODate } from "@/features/onboarding/domain/types";
import {
  formatMoney,
  parseMoneyInput,
} from "@/features/accounts/domain/types";
import type { Account, Pocket } from "@/features/accounts/domain/types";
import { PocketSelector } from "./PocketSelector";
import { ProtectedPocketWarning } from "./ProtectedPocketWarning";
import { useTransferMoney } from "../hooks/useTransferMoney";

interface Props {
  accounts: Account[];
  pockets: Pocket[];
  onDone: () => void;
  onCancel: () => void;
}

export function TransferForm({ accounts, pockets, onDone, onCancel }: Props) {
  const activeAccounts = accounts.filter((a) => a.is_active);
  const activePockets = pockets.filter((p) => p.is_active);

  const firstAcct = activeAccounts[0];
  const firstPocketsFrom = activePockets.filter(
    (p) => p.account_id === firstAcct?.id,
  );

  const [fromAccountId, setFromAccountId] = useState(firstAcct?.id ?? "");
  const [fromPocketId, setFromPocketId] = useState(
    firstPocketsFrom[0]?.id ?? "",
  );
  const [toAccountId, setToAccountId] = useState(firstAcct?.id ?? "");
  const [toPocketId, setToPocketId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(toISODate(new Date()));
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const transfer = useTransferMoney();
  const { toast } = useToast();

  const fromPocket = useMemo(
    () => activePockets.find((p) => p.id === fromPocketId) ?? null,
    [activePockets, fromPocketId],
  );
  const fromAccount = useMemo(
    () => activeAccounts.find((a) => a.id === fromAccountId) ?? null,
    [activeAccounts, fromAccountId],
  );
  const availableInSource = fromPocket ? Number(fromPocket.balance) : 0;
  const isProtected = fromPocket?.money_state === "protected";
  const currency = fromAccount?.currency ?? "COP";

  const onChangeFromAccount = (id: string) => {
    setFromAccountId(id);
    const list = activePockets.filter((p) => p.account_id === id);
    setFromPocketId(list[0]?.id ?? "");
  };
  const onChangeToAccount = (id: string) => {
    setToAccountId(id);
    const list = activePockets.filter(
      (p) => p.account_id === id && p.id !== fromPocketId,
    );
    setToPocketId(list[0]?.id ?? "");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = parseMoneyInput(amount);
    if (parsed === null || parsed <= 0) {
      return setError("Ingresa un monto mayor a cero.");
    }
    if (!fromPocketId || !toPocketId) {
      return setError("Elige un bolsillo origen y uno destino.");
    }
    if (fromPocketId === toPocketId) {
      return setError("El bolsillo destino debe ser distinto del origen.");
    }
    if (parsed > availableInSource) {
      return setError(
        `El monto supera lo disponible en el bolsillo origen (${formatMoney(availableInSource, currency)}).`,
      );
    }

    try {
      const result = await transfer.mutateAsync({
        amount: parsed,
        date,
        description: note.trim() || null,
        from_account_id: fromAccountId,
        from_pocket_id: fromPocketId,
        to_account_id: toAccountId,
        to_pocket_id: toPocketId,
      });
      toast(
        result.type === "emergency_use"
          ? "Uso de emergencia registrado."
          : "Traslado registrado.",
        "success",
      );
      onDone();
    } catch (err) {
      console.error(err);
      setError("No pudimos registrar el traslado. Intenta de nuevo.");
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">
          Trasladar dinero
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Mueve dinero entre bolsillos, dentro de una cuenta o entre cuentas.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <PocketSelector
        label="Desde"
        accounts={activeAccounts}
        pockets={activePockets}
        accountId={fromAccountId}
        pocketId={fromPocketId}
        onChangeAccount={onChangeFromAccount}
        onChangePocket={setFromPocketId}
        currency={currency}
      />

      {fromPocket && (
        <p className="text-xs text-muted-foreground">
          Disponible en <strong>{fromPocket.name}</strong>:{" "}
          <span className="font-semibold text-foreground tabular-numbers">
            {formatMoney(availableInSource, currency)}
          </span>
        </p>
      )}

      {isProtected && fromPocket && (
        <ProtectedPocketWarning pocketName={fromPocket.name} />
      )}

      <PocketSelector
        label="Hacia"
        accounts={activeAccounts}
        pockets={activePockets}
        accountId={toAccountId}
        pocketId={toPocketId}
        onChangeAccount={onChangeToAccount}
        onChangePocket={setToPocketId}
        excludePocketId={fromPocketId}
      />

      <Input
        label="Monto"
        inputMode="decimal"
        placeholder="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <Input
        label="Fecha"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <Input
        label="Nota (opcional)"
        placeholder="Ej. Ahorro mensual para vacaciones"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={200}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={transfer.isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={transfer.isPending}>
          Confirmar traslado
        </Button>
      </div>
    </form>
  );
}
