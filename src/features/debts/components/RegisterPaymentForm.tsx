import { useEffect, useMemo, useState } from "react";
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
import type { Category } from "@/features/budget/domain/types";
import { CategoryPickerByBlock } from "@/features/budget/components/CategoryPickerByBlock";
import { PocketSelector } from "@/features/movements/components/PocketSelector";
import type { Debt } from "../domain/types";
import { useRegisterDebtPayment } from "../hooks/useRegisterDebtPayment";

interface Props {
  debt: Debt;
  accounts: Account[];
  pockets: Pocket[];
  categories: Category[];
  onDone: () => void;
  onCancel: () => void;
}

export function RegisterPaymentForm({
  debt,
  accounts,
  pockets,
  categories,
  onDone,
  onCancel,
}: Props) {
  const activeAccounts = accounts.filter((a) => a.is_active);
  const activePockets = pockets.filter((p) => p.is_active);

  const firstAcct = activeAccounts[0];
  const firstPockets = activePockets.filter(
    (p) => p.account_id === firstAcct?.id,
  );

  const [accountId, setAccountId] = useState(firstAcct?.id ?? "");
  const [pocketId, setPocketId] = useState(firstPockets[0]?.id ?? "");
  const [amountTotal, setAmountTotal] = useState("");
  const [amountCapital, setAmountCapital] = useState("");
  const [capitalTouched, setCapitalTouched] = useState(false);
  const [date, setDate] = useState(toISODate(new Date()));
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const register = useRegisterDebtPayment();
  const { toast } = useToast();

  const pocket = useMemo(
    () => activePockets.find((p) => p.id === pocketId) ?? null,
    [activePockets, pocketId],
  );
  const account = useMemo(
    () => activeAccounts.find((a) => a.id === accountId) ?? null,
    [activeAccounts, accountId],
  );
  const available = pocket ? Number(pocket.balance) : 0;
  const currency = account?.currency ?? "COP";
  const pending = Number(debt.current_balance);

  // Por defecto abono_capital = monto_total (sin interés), hasta que el
  // usuario edite manualmente el campo capital.
  useEffect(() => {
    if (!capitalTouched) setAmountCapital(amountTotal);
  }, [amountTotal, capitalTouched]);

  const onChangeAccount = (id: string) => {
    setAccountId(id);
    const list = activePockets.filter((p) => p.account_id === id);
    setPocketId(list[0]?.id ?? "");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedTotal = parseMoneyInput(amountTotal);
    if (parsedTotal === null || parsedTotal <= 0) {
      return setError("Ingresa un monto total mayor a cero.");
    }
    const parsedCapital = parseMoneyInput(amountCapital);
    if (parsedCapital === null || parsedCapital <= 0) {
      return setError("El abono a capital debe ser mayor a cero.");
    }
    if (parsedCapital > parsedTotal) {
      return setError(
        "El abono a capital no puede ser mayor que el monto total pagado.",
      );
    }
    if (parsedCapital > pending) {
      return setError(
        `El abono a capital no puede superar el saldo pendiente (${formatMoney(pending, currency)}).`,
      );
    }
    if (!accountId || !pocketId) {
      return setError("Elige la cuenta y el bolsillo de donde sale el pago.");
    }
    if (parsedTotal > available) {
      return setError(
        `El monto supera lo disponible en ${pocket?.name ?? "el bolsillo"} (${formatMoney(available, currency)}).`,
      );
    }

    try {
      const result = await register.mutateAsync({
        debt_id: debt.id,
        amount_total: parsedTotal,
        amount_capital: parsedCapital,
        date,
        description: note.trim() || null,
        account_id: accountId,
        pocket_id: pocketId,
        category_id: categoryId || null,
      });
      toast(
        result.paid
          ? "¡Deuda saldada! Marcada como pagada."
          : result.linkedToBudget
            ? "Abono registrado y sumado a tu presupuesto."
            : "Abono registrado.",
        "success",
      );
      onDone();
    } catch (err) {
      console.error(err);
      setError("No pudimos registrar el abono. Intenta de nuevo.");
    }
  };

  const interest = useMemo(() => {
    const t = parseMoneyInput(amountTotal);
    const c = parseMoneyInput(amountCapital);
    if (t === null || c === null) return null;
    const diff = t - c;
    return diff > 0 ? diff : 0;
  }, [amountTotal, amountCapital]);

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">
          Registrar abono
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Saldo pendiente de <strong>{debt.creditor}</strong>:{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {formatMoney(pending, currency)}
          </span>
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <PocketSelector
        label="Desde"
        accounts={activeAccounts}
        pockets={activePockets}
        accountId={accountId}
        pocketId={pocketId}
        onChangeAccount={onChangeAccount}
        onChangePocket={setPocketId}
        currency={currency}
      />

      {pocket && (
        <p className="text-xs text-muted-foreground">
          Disponible en <strong>{pocket.name}</strong>:{" "}
          <span className="tabular-nums font-semibold text-foreground">
            {formatMoney(available, currency)}
          </span>
        </p>
      )}

      <Input
        label="Monto total pagado"
        inputMode="decimal"
        placeholder="0"
        value={amountTotal}
        onChange={(e) => setAmountTotal(e.target.value)}
        helperText="Lo que realmente sale de tu cuenta."
      />

      <Input
        label="Abono a capital"
        inputMode="decimal"
        placeholder="0"
        value={amountCapital}
        onChange={(e) => {
          setCapitalTouched(true);
          setAmountCapital(e.target.value);
        }}
        helperText="Cuánto de ese monto reduce lo que debes. Por defecto es igual al monto total; edítalo si el pago incluye interés."
      />

      {interest !== null && interest > 0 && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
          Interés estimado en este pago:{" "}
          <span className="font-semibold tabular-nums">
            {formatMoney(interest, currency)}
          </span>
          . Este monto se registra como salida de tu cuenta pero no reduce la
          deuda.
        </div>
      )}

      <Input
        label="Fecha"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <div className="flex flex-col gap-1.5">
        <CategoryPickerByBlock
          id="debt-payment-category"
          categories={categories}
          excludeCategoryIds={[]}
          value={categoryId}
          onChange={setCategoryId}
        />
        <p className="text-xs text-muted-foreground">
          Opcional. Si tienes una categoría de "Pago de deudas" en tu
          presupuesto del período, elígela para que este abono cuente como
          ejecución.
        </p>
      </div>

      <Input
        label="Nota (opcional)"
        placeholder="Ej. Pago cuota julio"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={200}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={register.isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={register.isPending}>
          Confirmar abono
        </Button>
      </div>
    </form>
  );
}
