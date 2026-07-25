import { Card } from "@/features/shared/components/Card";
import { Button } from "@/features/shared/components/Button";
import { formatMoney } from "@/features/accounts/domain/types";
import type { GoalPocket } from "../domain/types";
import { GoalProgressBar } from "./GoalProgressBar";

interface Props {
  goal: GoalPocket;
  currency: string;
  onEdit: () => void;
  onRemove: () => void;
}

export function GoalPocketCard({ goal, currency, onEdit, onRemove }: Props) {
  const pct = Math.round(goal.progressPct * 10) / 10;
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">
            {goal.pocket.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {goal.account.name}
          </span>
        </div>
        {goal.isComplete && (
          <span className="inline-flex items-center rounded-full border border-success/30 bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
            Meta cumplida
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="font-medium text-foreground tabular-numbers">
            {formatMoney(goal.balance, currency)}
          </span>
          <span className="text-xs text-muted-foreground tabular-numbers">
            de {formatMoney(goal.target, currency)}
          </span>
        </div>
        <GoalProgressBar pct={goal.progressPct} isComplete={goal.isComplete} />
        <div className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
          <span>{pct}% completado</span>
          {!goal.isComplete && (
            <span className="tabular-numbers">
              Faltan {formatMoney(goal.remaining, currency)}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onEdit}
          className="flex-1"
        >
          Editar meta
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onRemove}
          className="flex-1"
        >
          Quitar meta
        </Button>
      </div>
    </Card>
  );
}
