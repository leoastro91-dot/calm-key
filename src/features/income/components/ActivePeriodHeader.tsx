import { CalendarRange } from "lucide-react";
import { Card } from "@/features/shared/components/Card";
import { formatPeriodRange } from "../domain/types";
import { IncomeProgressBar } from "./IncomeProgressBar";
import type { ActivePeriod } from "../domain/types";

const PERIOD_TYPE_LABEL: Record<ActivePeriod["period_type"], string> = {
  monthly: "Mensual",
  biweekly: "Quincenal",
  weekly: "Semanal",
  custom: "Personalizado",
};

interface Props {
  period: ActivePeriod;
  currency: string;
}

export function ActivePeriodHeader({ period, currency }: Props) {
  return (
    <Card className="flex flex-col gap-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-primary">
            <CalendarRange size={20} aria-hidden />
          </span>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Período activo · {PERIOD_TYPE_LABEL[period.period_type]}
            </p>
            <p className="text-lg font-semibold text-foreground">
              {formatPeriodRange(period.start_date, period.end_date)}
            </p>
          </div>
        </div>
      </div>
      <IncomeProgressBar
        received={Number(period.total_income_received)}
        expected={Number(period.expected_income)}
        currency={currency}
      />
    </Card>
  );
}
