import { cn } from "@/lib/utils";
import {
  MONEY_STATE_LABELS,
  MONEY_STATE_TONE,
  type MoneyState,
} from "../domain/types";

export function MoneyStateBadge({
  state,
  className,
}: {
  state: MoneyState;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        MONEY_STATE_TONE[state].badge,
        className,
      )}
    >
      {MONEY_STATE_LABELS[state]}
    </span>
  );
}
