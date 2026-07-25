import { useState } from "react";
import { Input } from "@/features/shared/components/Input";
import { Button } from "@/features/shared/components/Button";
import { Alert } from "@/features/shared/components/Alert";
import { useToast } from "@/features/shared/components/Toast";
import { toISODate } from "@/features/onboarding/domain/types";
import { parseMoneyInput } from "@/features/accounts/domain/types";
import { useCreateDebt } from "../hooks/useCreateDebt";

interface Props {
  onDone: () => void;
  onCancel: () => void;
}

export function CreateDebtForm({ onDone, onCancel }: Props) {
  const [creditor, setCreditor] = useState("");
  const [capital, setCapital] = useState("");
  const [balance, setBalance] = useState("");
  const [monthly, setMonthly] = useState("");
  const [startDate, setStartDate] = useState(toISODate(new Date()));
  const [paymentDay, setPaymentDay] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const create = useCreateDebt();
  const { toast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!creditor.trim()) return setError("Ingresa a quién le debes.");
    const parsedCapital = parseMoneyInput(capital);
    if (parsedCapital === null || parsedCapital <= 0) {
      return setError("El capital inicial debe ser mayor a cero.");
    }
    const parsedBalance =
      balance.trim() === "" ? parsedCapital : parseMoneyInput(balance);
    if (parsedBalance === null || parsedBalance < 0) {
      return setError("El saldo actual no puede ser negativo.");
    }
    if (parsedBalance > parsedCapital) {
      return setError(
        "El saldo actual no puede ser mayor que el capital inicial.",
      );
    }
    const parsedMonthly =
      monthly.trim() === "" ? null : parseMoneyInput(monthly);
    if (parsedMonthly !== null && parsedMonthly < 0) {
      return setError("La cuota mensual no puede ser negativa.");
    }
    let parsedPaymentDay: number | null = null;
    if (paymentDay.trim() !== "") {
      const n = Number(paymentDay);
      if (!Number.isInteger(n) || n < 1 || n > 31) {
        return setError("El día de pago debe ser un número entre 1 y 31.");
      }
      parsedPaymentDay = n;
    }

    try {
      await create.mutateAsync({
        creditor,
        capital_initial: parsedCapital,
        current_balance: parsedBalance,
        monthly_payment: parsedMonthly,
        start_date: startDate,
        payment_day: parsedPaymentDay,
        notes: notes.trim() || null,
      });
      toast("Deuda registrada.", "success");
      onDone();
    } catch (err) {
      console.error(err);
      setError("No pudimos registrar la deuda. Intenta de nuevo.");
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">
          Agregar deuda
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Registra a quién le debes y cuánto queda pendiente. Podrás abonar
          desde cualquier cuenta.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Input
        label="Acreedor"
        placeholder="Ej. Tarjeta de crédito, Colegio Mateo, Papá…"
        value={creditor}
        onChange={(e) => setCreditor(e.target.value)}
        maxLength={100}
      />

      <Input
        label="Capital inicial"
        inputMode="decimal"
        placeholder="0"
        value={capital}
        onChange={(e) => setCapital(e.target.value)}
        helperText="El monto total original de la deuda."
      />

      <Input
        label="Saldo actual (opcional)"
        inputMode="decimal"
        placeholder="Igual al capital inicial si no has abonado"
        value={balance}
        onChange={(e) => setBalance(e.target.value)}
        helperText="Si ya habías abonado antes de usar la app, escribe cuánto queda hoy."
      />

      <Input
        label="Cuota mensual (opcional)"
        inputMode="decimal"
        placeholder="0"
        value={monthly}
        onChange={(e) => setMonthly(e.target.value)}
      />

      <Input
        label="Fecha de inicio"
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />

      <Input
        label="Día de pago (opcional)"
        type="number"
        min={1}
        max={31}
        placeholder="Ej. 5"
        value={paymentDay}
        onChange={(e) => setPaymentDay(e.target.value)}
      />

      <Input
        label="Notas (opcional)"
        placeholder="Ej. Última cuota, pago quincenal…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        maxLength={200}
      />

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
          Guardar deuda
        </Button>
      </div>
    </form>
  );
}
