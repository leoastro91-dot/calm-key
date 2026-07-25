import { Card } from "@/features/shared/components/Card";
import {
  MONEY_STATE_LABELS,
  MONEY_STATE_TONE,
  formatMoney,
} from "@/features/accounts/domain/types";
import type { MoneyStateTotals } from "../hooks/useDashboardData";

const STATES = ["available", "reserved", "protected", "committed"] as const;

interface Props {
  totals: MoneyStateTotals;
  currency: string;
}

export function MoneyStateGrid({ totals, currency }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {STATES.map((s) => (
        <Card key={s} className="flex flex-col gap-1.5 p-4">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${MONEY_STATE_TONE[s].dot}`}
              aria-hidden
            />
            <span className="text-xs text-muted-foreground">
              {MONEY_STATE_LABELS[s]}
            </span>
          </div>
          <span className="text-base font-semibold text-foreground tabular-numbers">
            {formatMoney(totals[s], currency)}
          </span>
        </Card>
      ))}
    </div>
  );
}
