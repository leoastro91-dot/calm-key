/**
 * Bloque de resumen de abonos: total pagado / capital / interés.
 * Los tres valores vienen de la suma real de transactions (LOVABLE-010 v1.1).
 */
import { formatMoney } from "@/features/accounts/domain/types";
import type { DebtPaymentsSummary } from "../domain/types";

interface Props {
  summary: DebtPaymentsSummary;
  currency: string;
}

export function PaymentsBreakdown({ summary, currency }: Props) {
  if (summary.total <= 0) return null;

  const cells = [
    { label: "Total pagado", value: summary.total, tone: "text-foreground" },
    { label: "A capital", value: summary.capital, tone: "text-success" },
    { label: "A interés", value: summary.interest, tone: "text-warning" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-muted/30 p-3">
      {cells.map((c) => (
        <div key={c.label} className="min-w-0">
          <p className="truncate text-[11px] text-muted-foreground">{c.label}</p>
          <p className={`truncate text-sm font-semibold tabular-nums ${c.tone}`}>
            {formatMoney(c.value, currency)}
          </p>
        </div>
      ))}
    </div>
  );
}
