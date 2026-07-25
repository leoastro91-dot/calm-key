import { Pencil } from "lucide-react";
import { Card } from "@/features/shared/components/Card";
import { Button } from "@/features/shared/components/Button";

interface Props {
  needs_pct: number;
  wants_pct: number;
  construction_pct: number;
  onEdit: () => void;
}

const ROWS: {
  key: "needs_pct" | "wants_pct" | "construction_pct";
  label: string;
  accent: string;
}[] = [
  { key: "needs_pct", label: "Necesidades", accent: "bg-sky-500" },
  { key: "wants_pct", label: "Deseos", accent: "bg-accent" },
  { key: "construction_pct", label: "Construcción", accent: "bg-primary" },
];

export function DistributionSummaryCard({
  needs_pct,
  wants_pct,
  construction_pct,
  onEdit,
}: Props) {
  const values = { needs_pct, wants_pct, construction_pct };
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Mi distribución 50/30/20
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Se usa para calcular el objetivo por bloque en tu presupuesto.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={onEdit}
          aria-label="Editar distribución"
        >
          <Pencil size={16} aria-hidden /> Editar
        </Button>
      </div>
      <ul className="flex flex-col gap-2">
        {ROWS.map((r) => (
          <li
            key={r.key}
            className="flex items-center justify-between gap-3 rounded-lg bg-muted px-4 py-3"
          >
            <span className="flex items-center gap-2 text-sm text-foreground">
              <span
                className={`h-2.5 w-2.5 rounded-full ${r.accent}`}
                aria-hidden
              />
              {r.label}
            </span>
            <span className="tabular-nums text-base font-semibold text-foreground">
              {values[r.key]}%
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
