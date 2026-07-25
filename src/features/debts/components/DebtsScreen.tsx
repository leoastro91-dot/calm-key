import { useState } from "react";
import { Plus } from "lucide-react";
import { Alert } from "@/features/shared/components/Alert";
import { Button } from "@/features/shared/components/Button";
import { Card } from "@/features/shared/components/Card";
import { Spinner } from "@/features/shared/components/Spinner";
import { useDebts } from "../hooks/useDebts";
import { CreateDebtForm } from "./CreateDebtForm";
import { DebtList } from "./DebtList";

export function DebtsScreen() {
  const {
    activeDebts,
    paidDebts,
    accounts,
    pockets,
    categories,
    isLoading,
    isError,
    refetch,
  } = useDebts();
  const [showForm, setShowForm] = useState(false);

  if (isLoading) {
    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">Cargando tus deudas…</p>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="flex flex-col gap-4">
        <Alert variant="error">
          No pudimos cargar tus deudas. Revisa tu conexión e intenta de nuevo.
        </Alert>
        <Button onClick={() => refetch()} fullWidth>
          Reintentar
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="self-start">
          <Plus size={18} aria-hidden /> Agregar deuda
        </Button>
      )}

      {showForm && (
        <Card className="p-5 sm:p-6">
          <CreateDebtForm
            onDone={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </Card>
      )}

      <DebtList
        title="Deudas activas"
        debts={activeDebts}
        accounts={accounts}
        pockets={pockets}
        categories={categories}
        emptyText="Aún no has registrado deudas activas. Cuando agregues una, aparecerá aquí con su saldo pendiente."
      />

      {paidDebts.length > 0 && (
        <DebtList
          title="Deudas pagadas"
          debts={paidDebts}
          accounts={accounts}
          pockets={pockets}
          categories={categories}
        />
      )}
    </div>
  );
}
