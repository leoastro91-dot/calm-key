/**
 * Bloque de resumen de abonos: total pagado / capital / interés,
 * más la tasa efectiva mensual (EM) y anual (EA) derivada del interés
 * promedio por abono sobre la deuda base (LOVABLE-010 v1.2).
 */
import { formatMoney } from "@/features/accounts/domain/types";
import {
  formatPct,
  interestRate,
  type Debt,
  type DebtPaymentsSummary,
} from "../domain/types";

interface Props {
  summary: DebtPaymentsSummary;
  currency: string;
  debt?: Debt;
}

export function PaymentsBreakdown({ summary, currency, debt }: Props) {
  if (summary.total <= 0) return null;

  const cells = [
    { label: "Total pagado", value: summary.total, tone: "text-foreground" },
    { label: "A capital", value: summary.capital, tone: "text-success" },
    { label: "A interés", value: summary.interest, tone: "text-warning" },
  ];

  const rate = debt ? interestRate(debt, summary) : null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
      <div className="grid grid-cols-3 gap-2">
        {cells.map((c) => (
          <div key={c.label} className="min-w-0">
            <p className="truncate text-[11px] text-muted-foreground">
              {c.label}
            </p>
            <p
              className={`truncate text-sm font-semibold tabular-nums ${c.tone}`}
            >
              {formatMoney(c.value, currency)}
            </p>
          </div>
        ))}
      </div>

      {rate && (
        <div className="flex flex-col gap-1 border-t border-border pt-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="min-w-0">
              <p className="truncate text-[11px] text-muted-foreground">
                Tasa efectiva mensual (EM)
              </p>
              <p className="truncate text-sm font-semibold tabular-nums text-warning">
                {formatPct(rate.monthlyPct)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11px] text-muted-foreground">
                Tasa efectiva anual (EA)
              </p>
              <p className="truncate text-sm font-semibold tabular-nums text-warning">
                {formatPct(rate.annualPct)}
              </p>
            </div>
          </div>
          <p className="text-[11px] leading-snug text-muted-foreground">
            Interés promedio por abono{" "}
            <span className="tabular-nums">
              {formatMoney(rate.avgInterest, currency)}
            </span>{" "}
            ÷ saldo de la deuda{" "}
            <span className="tabular-nums">
              {formatMoney(rate.base, currency)}
            </span>
            {summary.interestPayments > 1
              ? ` · promedio de ${summary.interestPayments} abonos con interés`
              : " · con un solo abono con interés registrado"}
            . EA = EM × 12.
          </p>
        </div>
      )}
    </div>
  );
}
