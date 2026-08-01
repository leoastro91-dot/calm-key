/**
 * Tarjeta superior de /deudas: interés total pagado entre todas las deudas.
 */
import { Card } from "@/features/shared/components/Card";
import { formatMoney } from "@/features/accounts/domain/types";
import { Percent } from "lucide-react";
import type { DebtPaymentsSummary } from "../domain/types";

interface Props {
  totals: DebtPaymentsSummary;
  currency: string;
}

export function TotalInterestCard({ totals, currency }: Props) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning"
        aria-hidden
      >
        <Percent size={22} />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">Interés pagado en total</p>
        <p className="text-2xl font-bold text-foreground tabular-nums">
          {formatMoney(totals.interest, currency)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          De {formatMoney(totals.total, currency)} pagados,{" "}
          <span className="tabular-nums">
            {formatMoney(totals.capital, currency)}
          </span>{" "}
          redujeron tus deudas.
        </p>
      </div>
    </Card>
  );
}
