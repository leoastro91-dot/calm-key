import { Link } from "@tanstack/react-router";
import { CreditCard } from "lucide-react";
import { Card } from "@/features/shared/components/Card";
import { formatMoney } from "@/features/accounts/domain/types";
import { formatDateEs } from "@/features/income/domain/types";
import type { DebtsSummary } from "../hooks/useDashboardData";

interface Props {
  summary: DebtsSummary;
  currency: string;
}

export function DebtsSummaryCard({ summary, currency }: Props) {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-foreground">Deudas</h2>
        <Link
          to="/deudas"
          className="text-xs font-medium text-primary hover:underline"
        >
          Ver todas →
        </Link>
      </div>
      {summary.activeCount === 0 ? (
        <p className="text-sm text-muted-foreground">
          No tienes deudas activas. ¡Sigue así!
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
              <CreditCard size={18} aria-hidden />
            </span>
            <div className="flex flex-1 flex-col">
              <span className="text-xs text-muted-foreground">
                Saldo pendiente total
              </span>
              <span className="text-lg font-semibold text-foreground tabular-numbers">
                {formatMoney(summary.total, currency)}
              </span>
              <span className="text-xs text-muted-foreground">
                {summary.activeCount} deuda
                {summary.activeCount === 1 ? "" : "s"} activa
                {summary.activeCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>
          {summary.nextPayment && (
            <div className="flex flex-col gap-1 rounded-lg border border-border p-3 text-sm">
              <span className="text-xs text-muted-foreground">
                Próxima cuota
              </span>
              <span className="font-semibold text-foreground">
                {summary.nextPayment.debt.creditor}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDateEs(summary.nextPayment.dateLabel)}
                {summary.nextPayment.daysUntil !== null &&
                  (summary.nextPayment.daysUntil === 0
                    ? " · hoy"
                    : ` · en ${summary.nextPayment.daysUntil} día${summary.nextPayment.daysUntil === 1 ? "" : "s"}`)}
                {summary.nextPayment.debt.monthly_payment
                  ? ` · ${formatMoney(Number(summary.nextPayment.debt.monthly_payment), currency)}`
                  : ""}
              </span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
