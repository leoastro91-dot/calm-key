import { formatMoney } from "@/features/accounts/domain/types";

interface Props {
  received: number;
  expected: number;
  currency: string;
}

export function IncomeProgressBar({ received, expected, currency }: Props) {
  const ratio = expected > 0 ? Math.min(1, received / expected) : 0;
  const pct = Math.round(ratio * 100);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted-foreground">Ingreso recibido</span>
        <span className="font-semibold text-foreground tabular-numbers">
          {formatMoney(received, currency)}
          <span className="text-muted-foreground"> / {formatMoney(expected, currency)}</span>
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Avance del ingreso del período"
      >
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {expected > 0
          ? `${pct}% del ingreso esperado del período`
          : "Sin ingreso esperado configurado para este período"}
      </p>
    </div>
  );
}
