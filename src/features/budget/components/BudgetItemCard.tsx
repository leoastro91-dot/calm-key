import { useState } from "react";
import { Pencil, Trash2, X, Check } from "lucide-react";
import { Input } from "@/features/shared/components/Input";
import { Button } from "@/features/shared/components/Button";
import { formatMoney, parseMoneyInput } from "@/features/accounts/domain/types";
import { useToast } from "@/features/shared/components/Toast";
import { BudgetExecutionBadge } from "@/features/expenses/components/BudgetExecutionBadge";
import type { BudgetItemWithCategory } from "../domain/types";
import {
  useDeleteBudgetItem,
  useUpdateBudgetItem,
} from "../hooks/useBudgetMutations";

interface Props {
  item: BudgetItemWithCategory;
  currency: string;
}

export function BudgetItemCard({ item, currency }: Props) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(item.projected_amount));
  const [error, setError] = useState<string | null>(null);
  const update = useUpdateBudgetItem();
  const del = useDeleteBudgetItem();
  const { toast } = useToast();
  const canDelete = Number(item.actual_amount) === 0;

  const save = async () => {
    setError(null);
    const parsed = parseMoneyInput(amount);
    if (parsed === null || parsed <= 0) {
      return setError("Monto inválido.");
    }
    try {
      await update.mutateAsync({ id: item.id, projected_amount: parsed });
      toast("Monto actualizado.", "success");
      setEditing(false);
    } catch {
      setError("No pudimos actualizar.");
    }
  };

  const remove = async () => {
    if (!canDelete) return;
    if (!window.confirm("¿Eliminar esta línea del presupuesto?")) return;
    try {
      await del.mutateAsync({
        id: item.id,
        actual_amount: Number(item.actual_amount),
      });
      toast("Línea eliminada.", "success");
    } catch {
      toast("No pudimos eliminar.", "error");
    }
  };

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">
              {item.category?.name ?? "Categoría"}
            </p>
            <BudgetExecutionBadge
              pct={Number(item.current_execution_pct)}
              warning={Number(item.alert_threshold_warning) || 50}
              critical={Number(item.alert_threshold_critical) || 80}
            />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Ejecutado: {formatMoney(Number(item.actual_amount), currency)}
          </p>
        </div>
        {!editing && (
          <p className="tabular-nums text-base font-semibold text-foreground">
            {formatMoney(Number(item.projected_amount), currency)}
          </p>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <Input
            label="Monto proyectado"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={error ?? undefined}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setAmount(String(item.projected_amount));
                setError(null);
              }}
            >
              <X size={16} aria-hidden /> Cancelar
            </Button>
            <Button type="button" loading={update.isPending} onClick={save}>
              <Check size={16} aria-hidden /> Guardar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setEditing(true)}
            aria-label="Editar monto proyectado"
          >
            <Pencil size={16} aria-hidden /> Editar
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={remove}
            disabled={!canDelete || del.isPending}
            aria-label="Eliminar línea"
            title={
              canDelete
                ? undefined
                : "No puedes eliminar una línea con ejecución real."
            }
          >
            <Trash2 size={16} aria-hidden /> Eliminar
          </Button>
        </div>
      )}
    </li>
  );
}
