import { useState } from "react";
import { Card } from "@/features/shared/components/Card";
import { Button } from "@/features/shared/components/Button";
import { PercentageSplitInput } from "@/features/shared/components/PercentageSplitInput";
import { useToast } from "@/features/shared/components/Toast";
import { useUpdateDistribution } from "../hooks/useDistribution";

interface Props {
  profileId: string;
  initial: {
    needs_pct: number;
    wants_pct: number;
    construction_pct: number;
  };
  onDone: () => void;
  onCancel: () => void;
}

export function EditDistributionForm({
  profileId,
  initial,
  onDone,
  onCancel,
}: Props) {
  const [values, setValues] = useState(initial);
  const update = useUpdateDistribution();
  const { toast } = useToast();

  const sum = values.needs_pct + values.wants_pct + values.construction_pct;
  const canSave = sum === 100 && !update.isPending;

  async function save() {
    try {
      await update.mutateAsync({
        id: profileId,
        needs_pct: values.needs_pct,
        wants_pct: values.wants_pct,
        construction_pct: values.construction_pct,
      });
      toast("Tu distribución se actualizó", "success");
      onDone();
    } catch (err) {
      const msg =
        err instanceof Error && err.message === "PCT_SUM_MUST_BE_100"
          ? "Los porcentajes deben sumar exactamente 100%."
          : "No pudimos guardar los cambios. Intenta de nuevo.";
      toast(msg, "error");
    }
  }

  return (
    <Card className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Editar distribución 50/30/20
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ajusta los tres bloques según tu meta real de este período. Deben
          sumar exactamente 100%.
        </p>
      </div>
      <PercentageSplitInput
        values={values}
        onChange={(patch) => setValues((v) => ({ ...v, ...patch }))}
        sum={sum}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={save}
          disabled={!canSave}
          loading={update.isPending}
        >
          Guardar
        </Button>
      </div>
    </Card>
  );
}
