import {
  FUNDING_SOURCE_HELP,
  FUNDING_SOURCE_LABELS,
  type ExpenseFundingSource,
} from "../domain/types";

interface Props {
  value: ExpenseFundingSource;
  onChange: (v: ExpenseFundingSource) => void;
  /** Muestra la nota de recomendación cuando el bolsillo no es "available". */
  showFundHint?: boolean;
}

const OPTIONS: ExpenseFundingSource[] = ["period_budget", "accumulated_fund"];

export function FundingSourceSelector({
  value,
  onChange,
  showFundHint,
}: Props) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-foreground">
        Origen de financiación
      </legend>
      <div
        role="radiogroup"
        aria-label="Origen de financiación"
        className="grid grid-cols-1 gap-2 sm:grid-cols-2"
      >
        {OPTIONS.map((opt) => {
          const selected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt)}
              className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                selected
                  ? "border-primary bg-primary/10 font-semibold text-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {FUNDING_SOURCE_LABELS[opt]}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">{FUNDING_SOURCE_HELP[value]}</p>
      {showFundHint && value === "accumulated_fund" && (
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          Recomendado para gastos planeados con ahorro previo, como SOAT,
          vacaciones, impuestos o mantenimiento.
        </p>
      )}
    </fieldset>
  );
}
