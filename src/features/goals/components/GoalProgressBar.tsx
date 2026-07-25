import { cn } from "@/lib/utils";

interface Props {
  pct: number;
  isComplete: boolean;
  className?: string;
}

/** Barra de progreso reutilizable: verde al 100%, primary mientras avanza. */
export function GoalProgressBar({ pct, isComplete, className }: Props) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-muted",
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all",
          isComplete ? "bg-success" : "bg-primary",
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
