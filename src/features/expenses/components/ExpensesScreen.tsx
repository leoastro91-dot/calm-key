import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Alert } from "@/features/shared/components/Alert";
import { Button } from "@/features/shared/components/Button";
import { Card } from "@/features/shared/components/Card";
import { Spinner } from "@/features/shared/components/Spinner";
import { formatPeriodRange } from "@/features/income/domain/types";
import { useExpenseHistory } from "../hooks/useExpenseHistory";
import { ExpenseForm } from "./ExpenseForm";
import { ExpenseHistoryList } from "./ExpenseHistoryList";

export function ExpensesScreen() {
  const {
    items,
    period,
    accounts,
    pockets,
    categories,
    subcategories,
    isLoading,
    isError,
    refetch,
  } = useExpenseHistory();
  const [showForm, setShowForm] = useState(false);

  const canRegister = useMemo(() => {
    const activeAccounts = accounts.filter((a) => a.is_active);
    const activePockets = pockets.filter((p) => p.is_active);
    return (
      Boolean(period) &&
      activeAccounts.length >= 1 &&
      activePockets.length >= 1 &&
      categories.length >= 1
    );
  }, [accounts, pockets, categories, period]);

  if (isLoading) {
    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">Cargando tus gastos…</p>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="flex flex-col gap-4">
        <Alert variant="error">
          No pudimos cargar tus gastos. Revisa tu conexión e intenta de nuevo.
        </Alert>
        <Button onClick={() => refetch()} fullWidth>
          Reintentar
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {period ? (
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Período activo
          </p>
          <p className="text-sm font-medium text-foreground">
            {formatPeriodRange(period.start_date, period.end_date)}
          </p>
        </Card>
      ) : (
        <Alert variant="warning">
          No tienes un período financiero activo. Completa tu configuración
          para poder registrar gastos.
        </Alert>
      )}

      {period && !canRegister && (
        <Alert variant="warning">
          Necesitas al menos una cuenta con un bolsillo activo y categorías
          disponibles para registrar gastos.
        </Alert>
      )}

      {canRegister && !showForm && (
        <Button onClick={() => setShowForm(true)} className="self-start">
          <Plus size={18} aria-hidden /> Registrar gasto
        </Button>
      )}

      {showForm && canRegister && (
        <Card className="p-5 sm:p-6">
          <ExpenseForm
            accounts={accounts}
            pockets={pockets}
            categories={categories}
            subcategories={subcategories}
            period={period}
            onDone={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </Card>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-foreground">
          Historial de gastos del período
        </h2>
        <ExpenseHistoryList items={items} />
      </section>
    </div>
  );
}
