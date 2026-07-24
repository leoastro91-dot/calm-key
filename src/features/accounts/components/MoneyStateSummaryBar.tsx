import { Card } from "@/features/shared/components/Card";
import { formatMoney } from "../domain/types";
import { MONEY_STATE_LABELS, MONEY_STATE_TONE } from "../domain/types";
import type { MoneyStateTotals } from "../hooks/useAccountsData";

interface Props {
  totals: MoneyStateTotals;
  currency: string;
}

const STATES = ["available", "reserved", "protected", "committed"] as const;

export function MoneyStateSummaryBar({ totals, currency }: Props) {
  return (
    <Card className="flex flex-col gap-4 p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-muted-foreground">Patrimonio total</p>
        <p className="text-2xl font-bold text-foreground tabular-numbers">
          {formatMoney(totals.total, currency)}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATES.map((s) => (
          <div key={s} className="flex flex-col gap-1 rounded-lg bg-muted p-3">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${MONEY_STATE_TONE[s].dot}`}
                aria-hidden
              />
              <span className="text-xs text-muted-foreground">
                {MONEY_STATE_LABELS[s]}
              </span>
            </div>
            <span className="text-sm font-semibold text-foreground tabular-numbers">
              {formatMoney(totals[s], currency)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
