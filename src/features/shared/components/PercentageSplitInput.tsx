import { useId } from "react";
import { cn } from "@/lib/utils";

interface Props {
  values: { needs_pct: number; wants_pct: number; construction_pct: number };
  onChange: (patch: Partial<Props["values"]>) => void;
  sum: number;
}

const FIELDS: {
  key: keyof Props["values"];
  label: string;
  hint: string;
}[] = [
  {
    key: "needs_pct",
    label: "Necesidades",
    hint: "Gastos esenciales: vivienda, comida, transporte.",
  },
  {
    key: "wants_pct",
    label: "Deseos",
    hint: "Ocio, entretenimiento, gustos personales.",
  },
  {
    key: "construction_pct",
    label: "Construcción",
    hint: "Ahorro, inversión, pago de deudas.",
  },
];

export function PercentageSplitInput({ values, onChange, sum }: Props) {
  const groupId = useId();
  const ok = sum === 100;
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        {FIELDS.map((f) => {
          const inputId = `${groupId}-${f.key}`;
          return (
            <div key={f.key} className="flex flex-col gap-1.5">
              <label
                htmlFor={inputId}
                className="text-sm font-medium text-foreground"
              >
                {f.label}
              </label>
              <div className="relative">
                <input
                  id={inputId}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={100}
                  value={values[f.key]}
                  onChange={(e) =>
                    onChange({ [f.key]: Number(e.target.value) || 0 } as Partial<
                      Props["values"]
                    >)
                  }
                  className="min-h-11 w-full rounded-lg border border-input bg-card px-3 py-2.5 pr-7 text-base tabular-nums text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  %
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {f.hint}
              </p>
            </div>
          );
        })}
      </div>
      <p
        aria-live="polite"
        className={cn(
          "text-sm font-medium tabular-nums",
          ok ? "text-success" : "text-warning",
        )}
      >
        Total: {sum}% {ok ? "✓" : "— debe sumar 100%"}
      </p>
    </div>
  );
}
