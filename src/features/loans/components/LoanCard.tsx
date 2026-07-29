import { useState } from "react";
import { Check, HandCoins } from "lucide-react";
import { Card } from "@/features/shared/components/Card";
import { Button } from "@/features/shared/components/Button";
import { formatMoney } from "@/features/accounts/domain/types";
import type { Account, Pocket } from "@/features/accounts/domain/types";
import {
  LOAN_STATUS_LABELS,
  expectedReturnAmount,
  isOverdue,
  type Loan,
} from "../domain/types";
import { RegisterRepaymentForm } from "./RegisterRepaymentForm";

interface Props {
  loan: Loan;
  accounts: Account[];
  pockets: Pocket[];
}

export function LoanCard({ loan, accounts, pockets }: Props) {
  const [open, setOpen] = useState(false);
  const isPaid = loan.status === "paid";
  const currency = "COP";
  const sourcePocket = pockets.find((p) => p.id === loan.pocket_id);
  const sourceAccount = accounts.find((a) => a.id === sourcePocket?.account_id);
  const overdue = isOverdue(loan);
  const hasActiveAccounts = accounts.some((a) => a.is_active);

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-foreground">
            {loan.borrower_name}
          </p>
          <p className="text-xs text-muted-foreground">
            Prestado el {loan.date_given}
            {sourcePocket && (
              <>
                {" · desde "}
                {sourceAccount ? `${sourceAccount.name} / ` : ""}
                {sourcePocket.name}
              </>
            )}
          </p>
        </div>
        <span
          className={
            isPaid
              ? "inline-flex items-center gap-1 rounded-full border border-success/40 bg-success/10 px-2.5 py-1 text-xs font-medium text-success"
              : "inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
          }
        >
          {isPaid && <Check size={12} aria-hidden />}
          {LOAN_STATUS_LABELS[loan.status]}
        </span>
      </div>

      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted-foreground">Monto prestado</span>
        <span className="text-base font-semibold text-foreground tabular-nums">
          {formatMoney(Number(loan.amount), currency)}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        {loan.has_interest ? (
          <>
            Con interés esperado de{" "}
            <span className="tabular-nums">
              {formatMoney(Number(loan.interest_amount ?? 0), currency)}
            </span>{" "}
            · Total esperado:{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {formatMoney(expectedReturnAmount(loan), currency)}
            </span>
          </>
        ) : (
          "Sin interés"
        )}
        {loan.expected_return_date && (
          <>
            {" · "}Devolución esperada: {loan.expected_return_date}
            {overdue && (
              <span className="ml-1 font-medium text-accent">(vencida)</span>
            )}
          </>
        )}
        {isPaid && loan.date_repaid && <> · Devuelto el {loan.date_repaid}</>}
      </p>

      {loan.notes && (
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          {loan.notes}
        </p>
      )}

      {!isPaid && !open && (
        <Button
          variant="secondary"
          className="self-start"
          onClick={() => setOpen(true)}
          disabled={!hasActiveAccounts}
        >
          <HandCoins size={16} aria-hidden /> Registrar devolución
        </Button>
      )}

      {!isPaid && open && (
        <RegisterRepaymentForm
          loan={loan}
          accounts={accounts}
          pockets={pockets}
          onDone={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      )}
    </Card>
  );
}
