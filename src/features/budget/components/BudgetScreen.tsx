import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Alert } from "@/features/shared/components/Alert";
import { Button } from "@/features/shared/components/Button";
import { Card } from "@/features/shared/components/Card";
import { Spinner } from "@/features/shared/components/Spinner";
import { accountRepository } from "@/features/accounts/services/accountRepository";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { useWorkspace } from "@/features/identity/hooks/useWorkspace";
import { useQuery } from "@tanstack/react-query";
import {
  useActiveBudget,
  useActivePeriod,
  useAvailableCategories,
  useBudgetItems,
  useFinancialProfile,
} from "../hooks/useBudgetData";
import {
  BLOCK_ORDER,
  type Block5030,
  type BudgetItemWithCategory,
} from "../domain/types";
import { BudgetBlockSummary } from "./BudgetBlockSummary";
import { BudgetItemList } from "./BudgetItemList";
import { AddBudgetItemForm } from "./AddBudgetItemForm";

function useCurrency() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: ["budget", "currency", workspace?.id],
    enabled: Boolean(user && workspace),
    queryFn: async () => {
      const accounts = await accountRepository.listByWorkspace(
        user!.id,
        workspace!.id,
      );
      const active = accounts.find((a) => a.is_active) ?? accounts[0];
      return active?.currency ?? "COP";
    },
  });
}

export function BudgetScreen() {
  const profileQ = useFinancialProfile();
  const periodQ = useActivePeriod();
  const period = periodQ.data ?? null;
  const budgetQ = useActiveBudget(period?.id);
  const budget = budgetQ.data ?? null;
  const itemsQ = useBudgetItems(budget?.id);
  const categoriesQ = useAvailableCategories();
  const currencyQ = useCurrency();
  const [showForm, setShowForm] = useState(false);

  const categoriesById = useMemo(() => {
    const map: Record<
      string,
      { id: string; name: string; block_5030: Block5030 }
    > = {};
    for (const c of categoriesQ.data ?? []) {
      map[c.id] = { id: c.id, name: c.name, block_5030: c.block_5030 };
    }
    return map;
  }, [categoriesQ.data]);

  const enrichedItems: BudgetItemWithCategory[] = useMemo(
    () =>
      (itemsQ.data ?? []).map((it) => ({
        ...it,
        category: categoriesById[it.category_id] ?? null,
      })),
    [itemsQ.data, categoriesById],
  );

  const byBlock = useMemo(() => {
    const totals: Record<Block5030, { projected: number; actual: number }> = {
      needs: { projected: 0, actual: 0 },
      wants: { projected: 0, actual: 0 },
      construction: { projected: 0, actual: 0 },
    };
    for (const item of enrichedItems) {
      const block = item.category?.block_5030;
      if (!block) continue;
      totals[block].projected += Number(item.projected_amount);
      totals[block].actual += Number(item.actual_amount);
    }
    return totals;
  }, [enrichedItems]);

  const usedCategoryIds = useMemo(
    () => (itemsQ.data ?? []).map((i) => i.category_id),
    [itemsQ.data],
  );

  if (periodQ.isPending || profileQ.isPending) {
    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">
          Cargando tu presupuesto…
        </p>
      </Card>
    );
  }

  if (periodQ.isError || profileQ.isError) {
    return (
      <Alert variant="error">
        No pudimos cargar tu presupuesto. Recarga la página e intenta de nuevo.
      </Alert>
    );
  }

  if (!period) {
    return (
      <Card className="flex flex-col items-center gap-2 py-8 text-center">
        <p className="text-base font-semibold text-foreground">
          No tienes un período financiero activo
        </p>
        <p className="text-sm text-muted-foreground">
          Completa tu configuración inicial para abrir tu primer período.
        </p>
      </Card>
    );
  }

  if (!profileQ.data) {
    return (
      <Card className="flex flex-col items-center gap-2 py-8 text-center">
        <p className="text-base font-semibold text-foreground">
          Falta tu perfil financiero
        </p>
        <p className="text-sm text-muted-foreground">
          Completa el onboarding para definir tu meta 50/30/20.
        </p>
      </Card>
    );
  }

  if (budgetQ.isPending) {
    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">
          Preparando el presupuesto del período…
        </p>
      </Card>
    );
  }

  if (budgetQ.isError || !budget) {
    return (
      <Alert variant="error">
        No pudimos preparar el presupuesto del período activo.
      </Alert>
    );
  }

  const currency = currencyQ.data ?? "COP";

  return (
    <div className="flex flex-col gap-5">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {BLOCK_ORDER.map((block) => (
          <BudgetBlockSummary
            key={block}
            block={block}
            projected={byBlock[block].projected}
            actual={byBlock[block].actual}
            profile={profileQ.data!}
            currency={currency}
          />
        ))}
      </section>

      {!showForm && (
        <Button
          onClick={() => setShowForm(true)}
          className="self-start"
          disabled={!categoriesQ.data?.length}
        >
          <Plus size={18} aria-hidden /> Agregar categoría al presupuesto
        </Button>
      )}

      {showForm && (
        <Card className="p-5 sm:p-6">
          <AddBudgetItemForm
            budgetId={budget.id}
            categories={categoriesQ.data ?? []}
            usedCategoryIds={usedCategoryIds}
            onDone={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </Card>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-foreground">
          Categorías del presupuesto
        </h2>
        {itemsQ.isPending ? (
          <Card className="flex justify-center py-6">
            <Spinner />
          </Card>
        ) : (
          <BudgetItemList items={enrichedItems} currency={currency} />
        )}
      </section>
    </div>
  );
}
