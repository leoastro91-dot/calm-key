import { Card } from "@/features/shared/components/Card";
import { formatMoney } from "@/features/accounts/domain/types";
import {
  BLOCK_LABELS,
  BLOCK_ORDER,
  blockTarget,
  type Block5030,
} from "@/features/budget/domain/types";
import type { BlockAggregate } from "../hooks/useDashboardData";

interface Props {
  blocks: Record<Block5030, BlockAggregate>;
  profile: {
    monthly_income: number;
    needs_pct: number;
    wants_pct: number;
    construction_pct: number;
  };
  currency: string;
}

const ACCENT: Record<Block5030, string> = {
  needs: "border-l-4 border-l-sky-500",
  wants: "border-l-4 border-l-accent",
  construction: "border-l-4 border-l-primary",
};

export function BudgetBlocksSummary({ blocks, profile, currency }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {BLOCK_ORDER.map((b) => {
        const agg = blocks[b];
        const target = blockTarget(b, profile);
        const denom = Math.max(target, agg.projected);
        const projRatio = denom > 0 ? Math.min(agg.projected / denom, 1) : 0;
        const actRatio = denom > 0 ? Math.min(agg.actual / denom, 1) : 0;
        const over = agg.actual > agg.projected && agg.projected > 0;
        return (
          <Card key={b} className={`flex flex-col gap-2 p-4 ${ACCENT[b]}`}>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                {BLOCK_LABELS[b]}
              </h3>
              <span className="text-xs text-muted-foreground">
                Meta {formatMoney(target, currency)}
              </span>
            </div>
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex items-baseline justify-between tabular-numbers">
                <span className="text-muted-foreground">Proyectado</span>
                <span className="font-semibold text-foreground">
                  {formatMoney(agg.projected, currency)}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary/70"
                  style={{ width: `${Math.max(projRatio * 100, 2)}%` }}
                />
              </div>
              <div className="mt-1 flex items-baseline justify-between tabular-numbers">
                <span className="text-muted-foreground">Ejecutado</span>
                <span
                  className={`font-semibold ${
                    over ? "text-destructive" : "text-foreground"
                  }`}
                >
                  {formatMoney(agg.actual, currency)}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={over ? "h-full bg-destructive" : "h-full bg-primary"}
                  style={{ width: `${Math.max(actRatio * 100, 2)}%` }}
                />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
