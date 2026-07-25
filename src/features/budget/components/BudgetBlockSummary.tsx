import { Card } from "@/features/shared/components/Card";
import { formatMoney } from "@/features/accounts/domain/types";
import {
  BLOCK_LABELS,
  blockPct,
  blockTarget,
  type Block5030,
} from "../domain/types";

interface Props {
  block: Block5030;
  projected: number;
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

export function BudgetBlockSummary({
  block,
  projected,
  profile,
  currency,
}: Props) {
  const target = blockTarget(block, profile);
  const pct = blockPct(block, profile);
  const ratio = target > 0 ? Math.min(projected / target, 1) : 0;
  const over = target > 0 && projected > target;

  return (
    <Card className={`flex flex-col gap-2 p-4 ${ACCENT[block]}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">
          {BLOCK_LABELS[block]}
        </h3>
        <span className="text-xs font-medium text-muted-foreground">
          {pct}% objetivo
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-3 tabular-nums">
        <span className="text-lg font-semibold text-foreground">
          {formatMoney(projected, currency)}
        </span>
        <span className="text-sm text-muted-foreground">
          de {formatMoney(target, currency)}
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(ratio * 100)}
        aria-label={`Avance del bloque ${BLOCK_LABELS[block]}`}
      >
        <div
          className={
            over
              ? "h-full bg-destructive"
              : "h-full bg-primary transition-[width]"
          }
          style={{ width: `${Math.max(ratio * 100, 2)}%` }}
        />
      </div>
      {over && (
        <p className="text-xs text-destructive">
          Superaste el objetivo del bloque por {formatMoney(projected - target, currency)}.
        </p>
      )}
    </Card>
  );
}
