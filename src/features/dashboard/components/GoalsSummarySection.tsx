import { Link } from "@tanstack/react-router";
import { Target } from "lucide-react";
import { Card } from "@/features/shared/components/Card";
import { formatMoney } from "@/features/accounts/domain/types";
import type { GoalPocket } from "@/features/goals/domain/types";
import { GoalProgressBar } from "@/features/goals/components/GoalProgressBar";

interface Props {
  goals: GoalPocket[];
  currency: string;
}

export function GoalsSummarySection({ goals, currency }: Props) {
  // Las 3 metas más cercanas a completarse (mayor % primero, sin cap).
  const top = [...goals]
    .sort((a, z) => z.rawProgressPct - a.rawProgressPct)
    .slice(0, 3);

  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-foreground">Metas</h2>
        <Link
          to="/metas"
          className="text-xs font-medium text-primary hover:underline"
        >
          Ver todas →
        </Link>
      </div>
      {top.length === 0 ? (
        <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Target size={18} aria-hidden />
          </span>
          <p className="text-sm text-muted-foreground">
            Aún no tienes metas configuradas. Ponle un objetivo a un bolsillo
            para ver aquí tu avance.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {top.map((g) => {
            const pct = Math.round(g.progressPct * 10) / 10;
            return (
              <li key={g.pocket.id} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium text-foreground">
                    {g.pocket.name}
                    <span className="ml-1 text-xs text-muted-foreground">
                      · {g.account.name}
                    </span>
                  </span>
                  <span
                    className={
                      g.isComplete
                        ? "text-xs font-semibold text-success"
                        : "text-xs font-medium text-muted-foreground"
                    }
                  >
                    {pct}%
                  </span>
                </div>
                <GoalProgressBar pct={g.progressPct} isComplete={g.isComplete} />
                <span className="text-xs text-muted-foreground tabular-numbers">
                  {formatMoney(g.balance, currency)} de{" "}
                  {formatMoney(g.target, currency)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
