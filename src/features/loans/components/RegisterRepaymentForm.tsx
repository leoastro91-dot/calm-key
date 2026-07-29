import { useMemo, useState } from "react";
import { Input } from "@/features/shared/components/Input";
import { Button } from "@/features/shared/components/Button";
import { Alert } from "@/features/shared/components/Alert";
import { useToast } from "@/features/shared/components/Toast";
import { toISODate } from "@/features/onboarding/domain/types";
import { parseMoneyInput } from "@/features/accounts/domain/types";
import type { Account, Pocket } from "@/features/accounts/domain/types";
import { PocketSelector } from "@/features/movements/components/PocketSelector";
import { useRegisterLoanRepayment } from "../hooks/useRegisterLoanRepayment";
import { expectedReturnAmount, type Loan } from "../domain/types";

interface Props {
  loan: Loan;
  accounts: Account[];
  pockets: Pocket[];
  onDone: () => void;
  onCancel: () => void;
}

export function RegisterRepaymentForm({
  loan,
  accounts,
  pockets,
  onDone,
  onCancel,
}: Props) {
  const firstAccount = useMemo(
    () => accounts.find((a) => a.is_active)?.id ?? "",
    [accounts],
  );
  const [accountId, setAccountId] = useState(firstAccount);
  const [pocketId, setPocketId] = useState(
    () =>
      pockets.find((p) => p.is_active && p.account_id === firstAccount)?.id ??
      "",
  );
  const [amount, setAmount] = useState(String(expectedReturnAmount(loan)));
  const [date, setDate] = useState(toISODate(new Date()));
  const [error, setError] = useState<string | null>(null);

  const register = useRegisterLoanRepayment();
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

    if (loan.status !== "active") {
      return setError("Este préstamo ya fue devuelto.");
    }
    if (!pocketId) return setError("Selecciona el bolsillo destino.");
    const parsed = parseMoneyInput(amount);
    if (parsed === null || parsed <= 0) {
      return setError("El monto devuelto debe ser mayor a cero.");
    }

    try {
      await register.mutateAsync({
        loan_id: loan.id,
        amount: parsed,
        date,
        account_id: accountId,
        pocket_id: pocketId,
      });
      toast("Devolución registrada. El préstamo quedó pagado.", "success");
      onDone();
    } catch (err) {
      console.error(err);
      const code = err instanceof Error ? err.message : "";
      setError(
        code === "LOAN_ALREADY_PAID"
          ? "Este préstamo ya fue devuelto."
          : "No pudimos registrar la devolución. Intenta de nuevo.",
      );
    }
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-4 rounded-lg border border-border/60 bg-muted/30 p-4"
    >
      <h4 className="text-sm font-semibold text-foreground">
        Registrar devolución de {loan.borrower_name}
      </h4>

      {error && <Alert variant="error">{error}</Alert>}

      <PocketSelector
        label="Bolsillo destino"
        accounts={accounts}
        pockets={pockets}
        accountId={accountId}
        pocketId={pocketId}
        onChangeAccount={handleAccount}
        onChangePocket={setPocketId}
      />

      <Input
        label="Monto devuelto"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        helperText={
          loan.has_interest
            ? "Puede incluir el interés: se registra como un solo monto."
            : "Por defecto es el monto prestado."
        }
      />

      <Input
        label="Fecha de la devolución"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
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
          Confirmar devolución
        </Button>
      </div>
    </form>
  );
}
