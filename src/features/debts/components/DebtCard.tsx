import { useState } from "react";
import { Plus, ChevronDown, ChevronUp, Check } from "lucide-react";
import { Card } from "@/features/shared/components/Card";
import { Button } from "@/features/shared/components/Button";
import { formatMoney } from "@/features/accounts/domain/types";
import type { Account, Pocket } from "@/features/accounts/domain/types";
import type { Category } from "@/features/budget/domain/types";
import { DEBT_STATUS_LABELS, paidProgress, type Debt } from "../domain/types";
import { useDebtPaymentSummaries } from "../hooks/useDebtPaymentSummaries";
import { PaymentsBreakdown } from "./PaymentsBreakdown";
import { RegisterPaymentForm } from "./RegisterPaymentForm";
import { PaymentHistoryList } from "./PaymentHistoryList";

interface Props {
  debt: Debt;
  accounts: Account[];
  pockets: Pocket[];
  categories: Category[];
}

export function DebtCard({ debt, accounts, pockets, categories }: Props) {
  const [payOpen, setPayOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { paid, pct } = paidProgress(debt);
  const capital = Number(debt.capital_initial);
  const balance = Number(debt.current_balance);
  const currency = "COP";
  const isPaid = debt.status === "paid";
  const hasActiveAccounts = accounts.some((a) => a.is_active);
  const { getSummary } = useDebtPaymentSummaries();
  const summary = getSummary(debt.id);

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-foreground">
            {debt.creditor}
          </p>
          <p className="text-xs text-muted-foreground">
            Capital inicial:{" "}
            <span className="tabular-nums">{formatMoney(capital, currency)}</span>
          </p>
        </div>
        <span
          className={
            isPaid
              ? "inline-flex items-center gap-1 rounded-full border border-success/40 bg-success/10 px-2.5 py-1 text-xs font-medium text-success"
              : "inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
          }
        >
          {isPaid && <Check size={12} aria-hidden />}
          {DEBT_STATUS_LABELS[debt.status]}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="text-muted-foreground">Saldo pendiente</span>
          <span className="text-base font-semibold text-foreground tabular-nums">
            {formatMoney(balance, currency)}
          </span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
          aria-label={`Progreso pagado: ${Math.round(pct)}%`}
        >
          <div
            className={
              isPaid
                ? "h-full rounded-full bg-success transition-all"
                : "h-full rounded-full bg-primary transition-all"
            }
            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Pagado:{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {formatMoney(paid, currency)}
          </span>{" "}
          ({Math.round(pct)}%)
          {debt.monthly_payment != null && Number(debt.monthly_payment) > 0 && (
            <>
              {" · "}Cuota mensual sugerida:{" "}
              <span className="tabular-nums">
                {formatMoney(Number(debt.monthly_payment), currency)}
              </span>
            </>
          )}
          {debt.payment_day && <> · Día de pago: {debt.payment_day}</>}
        </p>
      </div>

      <PaymentsBreakdown summary={summary} currency={currency} debt={debt} />

      {debt.notes && (
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          {debt.notes}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        {!isPaid && (
          <Button
            variant={payOpen ? "secondary" : "primary"}
            onClick={() => setPayOpen((v) => !v)}
            disabled={!hasActiveAccounts}
          >
            <Plus size={16} aria-hidden />{" "}
            {payOpen ? "Cerrar" : "Registrar abono"}
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={() => setHistoryOpen((v) => !v)}
          aria-expanded={historyOpen}
        >
          {historyOpen ? (
            <>
              <ChevronUp size={16} aria-hidden /> Ocultar abonos
            </>
          ) : (
            <>
              <ChevronDown size={16} aria-hidden /> Ver abonos
            </>
          )}
        </Button>
      </div>

      {!isPaid && payOpen && hasActiveAccounts && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <RegisterPaymentForm
            debt={debt}
            accounts={accounts}
            pockets={pockets}
            categories={categories}
            onDone={() => setPayOpen(false)}
            onCancel={() => setPayOpen(false)}
          />
        </div>
      )}

      {historyOpen && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-foreground">
            Historial de abonos
          </p>
          <PaymentHistoryList
            debtId={debt.id}
            currency={currency}
            accounts={accounts}
            pockets={pockets}
          />
        </div>
      )}
    </Card>
  );
}
