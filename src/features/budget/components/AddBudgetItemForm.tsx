import { useState } from "react";
import { Input } from "@/features/shared/components/Input";
import { Button } from "@/features/shared/components/Button";
import { Alert } from "@/features/shared/components/Alert";
import { useToast } from "@/features/shared/components/Toast";
import { parseMoneyInput } from "@/features/accounts/domain/types";
import type { Category } from "../domain/types";
import { CategoryPickerByBlock } from "./CategoryPickerByBlock";
import { useAddBudgetItem } from "../hooks/useBudgetMutations";

interface Props {
  budgetId: string;
  categories: Category[];
  usedCategoryIds: string[];
  onDone: () => void;
  onCancel: () => void;
}

export function AddBudgetItemForm({
  budgetId,
  categories,
  usedCategoryIds,
  onDone,
  onCancel,
}: Props) {
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const add = useAddBudgetItem();
  const { toast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!categoryId) return setError("Elige una categoría.");
    const parsed = parseMoneyInput(amount);
    if (parsed === null || parsed <= 0) {
      return setError("Ingresa un monto proyectado mayor a cero.");
    }
    if (usedCategoryIds.includes(categoryId)) {
      return setError("Esta categoría ya está en tu presupuesto.");
    }
    try {
      await add.mutateAsync({
        budget_id: budgetId,
        category_id: categoryId,
        projected_amount: parsed,
      });
      toast("Categoría agregada al presupuesto.", "success");
      onDone();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("duplicate") || msg.includes("uq_budget_items")) {
        setError("Esta categoría ya está en tu presupuesto.");
      } else {
        console.error(err);
        setError("No pudimos guardar la línea. Intenta de nuevo.");
      }
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">
          Agregar categoría al presupuesto
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Elige una categoría y define cuánto proyectas gastar este período.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <CategoryPickerByBlock
        id="budget-category"
        categories={categories}
        excludeCategoryIds={usedCategoryIds}
        value={categoryId}
        onChange={setCategoryId}
      />

      <Input
        label="Monto proyectado"
        inputMode="decimal"
        placeholder="800.000"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={add.isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={add.isPending}>
          Guardar categoría
        </Button>
      </div>
    </form>
  );
}
