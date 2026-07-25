import { cn } from "@/lib/utils";
import { executionStatus } from "../domain/types";

interface Props {
  pct: number;
  warning?: number;
  critical?: number;
  className?: string;
}

const TONE: Record<
  ReturnType<typeof executionStatus>["level"],
  string
> = {
  ok: "bg-muted text-muted-foreground border-border",
  info: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  danger: "bg-accent/20 text-accent-foreground border-accent/40",
  over: "bg-destructive/15 text-destructive border-destructive/40",
};

/**
 * Indicador visual del % ejecutado de un budget_item.
 * Usa los thresholds propios del item (por defecto 50/80).
 */
export function BudgetExecutionBadge({
  pct,
  warning = 50,
  critical = 80,
  className,
}: Props) {
  const safePct = Number.isFinite(pct) ? pct : 0;
  const status = executionStatus({ pct: safePct, warning, critical });
  const rounded = Math.round(safePct);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tabular-nums",
        TONE[status.level],
        className,
      )}
      title={status.label}
    >
      <span aria-hidden>{rounded}%</span>
      <span className="sr-only">{status.label}</span>
    </span>
  );
}
