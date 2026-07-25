import { CalendarRange } from "lucide-react";
import { Card } from "@/features/shared/components/Card";
import { IncomeProgressBar } from "@/features/income/components/IncomeProgressBar";
import { formatPeriodRange } from "@/features/income/domain/types";
import type { ActivePeriod } from "@/features/income/domain/types";

interface Props {
  period: ActivePeriod;
  daysRemaining: number | null;
  currency: string;
}

export function ActivePeriodProgress({ period, daysRemaining, currency }: Props) {
  return (
    <Card className="flex flex-col gap-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-primary">
            <CalendarRange size={20} aria-hidden />
          </span>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Período activo
            </p>
            <p className="text-lg font-semibold text-foreground">
              {formatPeriodRange(period.start_date, period.end_date)}
            </p>
          </div>
        </div>
        {daysRemaining !== null && (
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
            {daysRemaining === 0
              ? "Último día"
              : `${daysRemaining} día${daysRemaining === 1 ? "" : "s"} restantes`}
          </span>
        )}
      </div>
      <IncomeProgressBar
        received={Number(period.total_income_received)}
        expected={Number(period.expected_income)}
        currency={currency}
      />
    </Card>
  );
}
