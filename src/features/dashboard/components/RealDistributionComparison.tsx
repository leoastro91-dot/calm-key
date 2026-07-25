import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/features/shared/components/Card";
import { formatMoney } from "@/features/accounts/domain/types";
import {
  BLOCK_LABELS,
  BLOCK_ORDER,
  type Block5030,
} from "@/features/budget/domain/types";
import type { BlockAggregate } from "../hooks/useDashboardData";

interface Props {
  blocks: Record<Block5030, BlockAggregate>;
  totalActual: number;
  profile: {
    needs_pct: number;
    wants_pct: number;
    construction_pct: number;
  };
  currency: string;
}

function targetPct(block: Block5030, p: Props["profile"]) {
  if (block === "needs") return p.needs_pct;
  if (block === "wants") return p.wants_pct;
  return p.construction_pct;
}

export function RealDistributionComparison({
  blocks,
  totalActual,
  profile,
  currency,
}: Props) {
  const [open, setOpen] = useState<Record<Block5030, boolean>>({
    needs: false,
    wants: false,
    construction: false,
  });

  if (totalActual <= 0) {
    return (
      <Card className="flex flex-col gap-1 p-5 text-center">
        <p className="text-base font-semibold text-foreground">
          Aún no hay ejecución en este período
        </p>
        <p className="text-sm text-muted-foreground">
          Registra tus primeros gastos para ver la distribución real 50/30/20.
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col divide-y divide-border p-0">
      {BLOCK_ORDER.map((b) => {
        const agg = blocks[b];
        const realPct = totalActual > 0 ? (agg.actual / totalActual) * 100 : 0;
        const target = targetPct(b, profile);
        const delta = realPct - target;
        const isOpen = open[b];
        const tone =
          Math.abs(delta) < 3
            ? "text-muted-foreground"
            : delta > 0
              ? "text-destructive"
              : "text-primary";
        return (
          <div key={b} className="flex flex-col">
            <button
              type="button"
              onClick={() => setOpen((s) => ({ ...s, [b]: !s[b] }))}
              className="flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-muted/40"
              aria-expanded={isOpen}
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-foreground">
                  {BLOCK_LABELS[b]}
                </span>
                <span className="text-xs text-muted-foreground tabular-numbers">
                  {formatMoney(agg.actual, currency)} ejecutado
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end tabular-numbers">
                  <span className="text-base font-semibold text-foreground">
                    {realPct.toFixed(0)}%{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      / meta {target}%
                    </span>
                  </span>
                  <span className={`text-xs ${tone}`}>
                    {delta > 0 ? "+" : ""}
                    {delta.toFixed(1)} pts
                  </span>
                </div>
                <ChevronDown
                  size={18}
                  aria-hidden
                  className={`text-muted-foreground transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>
            {isOpen && (
              <div className="flex flex-col gap-2 bg-muted/30 px-5 py-3">
                {agg.items.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Sin categorías con ejecución en este bloque.
                  </p>
                ) : (
                  <ul className="flex flex-col divide-y divide-border/60">
                    {agg.items
                      .filter((it) => Number(it.actual_amount) > 0)
                      .map((it) => (
                        <li
                          key={it.id}
                          className="flex items-center justify-between gap-3 py-2 text-sm"
                        >
                          <span className="text-foreground">
                            {it.category?.name ?? "—"}
                          </span>
                          <span className="tabular-numbers text-muted-foreground">
                            {formatMoney(Number(it.actual_amount), currency)}
                          </span>
                        </li>
                      ))}
                    {agg.items.every((it) => Number(it.actual_amount) === 0) && (
                      <li className="py-2 text-xs text-muted-foreground">
                        Aún sin ejecución en las categorías de este bloque.
                      </li>
                    )}
                  </ul>
                )}
                <Link
                  to="/presupuesto"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Ver todo en Presupuesto →
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </Card>
  );
}
