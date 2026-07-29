import { useMemo, useState } from "react";
import { Input } from "@/features/shared/components/Input";
import { Button } from "@/features/shared/components/Button";
import { Alert } from "@/features/shared/components/Alert";
import { useToast } from "@/features/shared/components/Toast";
import { toISODate } from "@/features/onboarding/domain/types";
import { parseMoneyInput } from "@/features/accounts/domain/types";
import type { Account, Pocket } from "@/features/accounts/domain/types";
import { PocketSelector } from "@/features/movements/components/PocketSelector";
import { useCreateLoan } from "../hooks/useCreateLoan";

interface Props {
  accounts: Account[];
  pockets: Pocket[];
  onDone: () => void;
  onCancel: () => void;
}

export function CreateLoanForm({ accounts, pockets, onDone, onCancel }: Props) {
  const firstAccount = useMemo(
    () => accounts.find((a) => a.is_active)?.id ?? "",
    [accounts],
  );
  const [accountId, setAccountId] = useState(firstAccount);
  const [pocketId, setPocketId] = useState(
    () => pockets.find((p) => p.is_active && p.account_id === firstAccount)?.id ?? "",
  );
  const [borrower, setBorrower] = useState("");
  const [amount, setAmount] = useState("");
  const [dateGiven, setDateGiven] = useState(toISODate(new Date()));
  const [expected, setExpected] = useState("");
  const [hasInterest, setHasInterest] = useState(false);
  const [interest, setInterest] = useState("");
  const [notes, setNotes] = useState("");
  const [retroactive, setRetroactive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCreateLoan();
  const { toast } = useToast();

  const handleAccount = (id: string) => {
    setAccountId(id);
    setPocketId(
      pockets.find((p) => p.is_active && p.account_id === id)?.id ?? "",
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!borrower.trim()) return setError("Escribe a quién le prestaste.");
    if (!pocketId) return setError("Selecciona el bolsillo de origen.");
    const parsed = parseMoneyInput(amount);
    if (parsed === null || parsed <= 0) {
      return setError("El monto prestado debe ser mayor a cero.");
    }
    let parsedInterest: number | null = null;
    if (hasInterest) {
      parsedInterest = parseMoneyInput(interest);
      if (parsedInterest === null || parsedInterest <= 0) {
        return setError("Indica el monto de interés esperado.");
      }
    }

    try {
      await create.mutateAsync({
        borrower_name: borrower,
        amount: parsed,
        account_id: accountId,
        pocket_id: pocketId,
        date_given: dateGiven,
        expected_return_date: expected.trim() ? expected : null,
        has_interest: hasInterest,
        interest_amount: parsedInterest,
        notes: notes.trim() || null,
        retroactive,
      });
      toast(
        retroactive
          ? "Préstamo histórico registrado (sin mover saldos)."
          : "Préstamo registrado.",
        "success",
      );
      onDone();
    } catch (err) {
      console.error(err);
      const code = err instanceof Error ? err.message : "";
      if (code === "AMOUNT_EXCEEDS_POCKET") {
        setError("El monto supera el saldo disponible en ese bolsillo.");
      } else {
        setError("No pudimos registrar el préstamo. Intenta de nuevo.");
      }
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Prestar dinero</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Registra dinero que le prestaste a alguien. Sale del bolsillo que
          elijas y no afecta tu presupuesto.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <PocketSelector
        label="Bolsillo de origen"
        accounts={accounts}
        pockets={pockets}
        accountId={accountId}
        pocketId={pocketId}
        onChangeAccount={handleAccount}
        onChangePocket={setPocketId}
      />

      <Input
        label="¿A quién le prestaste?"
        placeholder="Ej. Hermano, Ana, Compañero de trabajo…"
        value={borrower}
        onChange={(e) => setBorrower(e.target.value)}
        maxLength={100}
      />

      <Input
        label="Monto prestado"
        inputMode="decimal"
        placeholder="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <Input
        label="Fecha del préstamo"
        type="date"
        value={dateGiven}
        onChange={(e) => setDateGiven(e.target.value)}
      />

      <Input
        label="Fecha esperada de devolución (opcional)"
        type="date"
        value={expected}
        onChange={(e) => setExpected(e.target.value)}
      />

      <label className="flex items-start gap-2.5 text-sm text-foreground">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
          checked={hasInterest}
          onChange={(e) => setHasInterest(e.target.checked)}
        />
        <span>Este préstamo tiene interés</span>
      </label>

      {hasInterest && (
        <Input
          label="Interés esperado"
          inputMode="decimal"
          placeholder="0"
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          helperText="Sólo informativo: al devolver registrarás un único monto total."
        />
      )}

      <Input
        label="Notas (opcional)"
        placeholder="Ej. Quedó de devolverlo con el pago de nómina."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        maxLength={200}
      />

      <label className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-muted/40 p-3 text-sm text-foreground">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
          checked={retroactive}
          onChange={(e) => setRetroactive(e.target.checked)}
        />
        <span>
          Préstamo histórico: el dinero ya salió antes de usar la app.
          <span className="block text-xs text-muted-foreground">
            No se descuenta el bolsillo ni se crea un movimiento; sólo queda el
            registro del préstamo.
          </span>
        </span>
      </label>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={create.isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={create.isPending}>
          Guardar préstamo
        </Button>
      </div>
    </form>
  );
}
