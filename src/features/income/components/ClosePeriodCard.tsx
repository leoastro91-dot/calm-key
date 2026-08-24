import { useState } from "react";
import { CalendarSync, Landmark, PiggyBank, CreditCard } from "lucide-react";
import { Alert } from "@/features/shared/components/Alert";
import { Button } from "@/features/shared/components/Button";
import { Card } from "@/features/shared/components/Card";
import { Input } from "@/features/shared/components/Input";
import { Spinner } from "@/features/shared/components/Spinner";
import { formatMoney } from "@/features/accounts/domain/types";
import {
  nextStartDate,
  suggestedEndDate,
  useCarryoverSummary,
  useClosePeriod,
} from "../hooks/useClosePeriod";
import { formatPeriodRange, type ActivePeriod } from "../domain/types";

interface Props {
  period: ActivePeriod;
  currency: string;
}

export function ClosePeriodCard({ period, currency }: Props) {
  const summaryQ = useCarryoverSummary();
  const close = useClosePeriod();
  const [open, setOpen] = useState(false);

  const defaultStart = nextStartDate(period.end_date);
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(
    suggestedEndDate(period.period_type, defaultStart),
  );
  const [expected, setExpected] = useState<string>("");

  const summary = summaryQ.data;
  const expectedValue =
    expected.trim() === ""
      ? (summary?.expectedIncome ?? Number(period.expected_income))
      : Number(expected);

  const invalidRange = end <= start;

  if (!open) {
    return (
      <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CalendarSync size={20} aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Cerrar ciclo y abrir el siguiente
            </p>
            <p className="text-xs text-muted-foreground">
              Tus ahorros y deudas se mantienen; solo empieza un nuevo período
              de control de gastos.
            </p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Cerrar período
        </Button>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4 p-5 sm:p-6">
      <div>
        <p className="text-sm font-semibold text-foreground">
          Cerrar el período {formatPeriodRange(period.start_date, period.end_date)}
        </p>
        <p className="text-xs text-muted-foreground">
          Se marcará como cerrado y se abrirá uno nuevo con las fechas que
          definas.
        </p>
      </div>

      {summaryQ.isPending ? (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      ) : summary ? (
        <ul className="flex flex-col gap-2 rounded-xl bg-muted/50 p-4 text-sm">
          <li className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Landmark size={16} aria-hidden /> Patrimonio que se traslada
            </span>
            <span className="font-semibold tabular-nums text-foreground">
              {formatMoney(summary.patrimony, summary.currency)}
            </span>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted-foreground">
              <PiggyBank size={16} aria-hidden /> Ahorros acumulados (
              {summary.savingsPockets} bolsillos)
            </span>
            <span className="font-semibold tabular-nums text-foreground">
              {formatMoney(summary.savings, summary.currency)}
            </span>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted-foreground">
              <CreditCard size={16} aria-hidden /> Deudas activas (
              {summary.debtCount})
            </span>
            <span className="font-semibold tabular-nums text-foreground">
              {formatMoney(summary.debtBalance, summary.currency)}
            </span>
          </li>
        </ul>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          label="Inicio del nuevo período"
          type="date"
          value={start}
          onChange={(e) => {
            setStart(e.target.value);
            if (e.target.value) {
              setEnd(suggestedEndDate(period.period_type, e.target.value));
            }
          }}
        />
        <Input
          label="Fin del nuevo período"
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />
      </div>

      <Input
        label="Ingreso esperado del nuevo período"
        type="number"
        inputMode="decimal"
        min="0"
        placeholder={String(summary?.expectedIncome ?? period.expected_income)}
        value={expected}
        onChange={(e) => setExpected(e.target.value)}
        hint={`Sugerido según tus fuentes de ingreso: ${formatMoney(
          summary?.expectedIncome ?? Number(period.expected_income),
          currency,
        )}`}
      />

      {invalidRange && (
        <Alert variant="warning">
          La fecha de fin debe ser posterior a la de inicio.
        </Alert>
      )}

      {close.isError && (
        <Alert variant="error">
          No pudimos cerrar el período. Intenta de nuevo.
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() =>
            close.mutate(
              {
                period,
                period_type: period.period_type,
                start_date: start,
                end_date: end,
                expected_income: Number.isFinite(expectedValue)
                  ? expectedValue
                  : 0,
              },
              { onSuccess: () => setOpen(false) },
            )
          }
          disabled={invalidRange || close.isPending}
        >
          {close.isPending ? "Cerrando…" : "Confirmar cierre y abrir ciclo"}
        </Button>
        <Button
          variant="ghost"
          onClick={() => setOpen(false)}
          disabled={close.isPending}
        >
          Cancelar
        </Button>
      </div>
    </Card>
  );
}
