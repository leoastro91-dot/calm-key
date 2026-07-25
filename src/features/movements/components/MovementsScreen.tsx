import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Alert } from "@/features/shared/components/Alert";
import { Button } from "@/features/shared/components/Button";
import { Card } from "@/features/shared/components/Card";
import { Spinner } from "@/features/shared/components/Spinner";
import { useTransferHistory } from "../hooks/useTransferHistory";
import { TransferForm } from "./TransferForm";
import { TransferHistoryList } from "./TransferHistoryList";

export function MovementsScreen() {
  const { items, accounts, pockets, isLoading, isError, refetch } =
    useTransferHistory();
  const [showForm, setShowForm] = useState(false);

  const canTransfer = useMemo(() => {
    const activeAccounts = accounts.filter((a) => a.is_active);
    const activePockets = pockets.filter((p) => p.is_active);
    // Se necesita al menos 2 bolsillos activos para poder trasladar.
    return activeAccounts.length >= 1 && activePockets.length >= 2;
  }, [accounts, pockets]);

  if (isLoading) {
    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">Cargando tus traslados…</p>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="flex flex-col gap-4">
        <Alert variant="error">
          No pudimos cargar tus movimientos. Revisa tu conexión e intenta de
          nuevo.
        </Alert>
        <Button onClick={() => refetch()} fullWidth>
          Reintentar
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {!canTransfer && (
        <Alert variant="warning">
          Necesitas al menos dos bolsillos activos (en la misma cuenta o en
          cuentas distintas) para poder trasladar dinero.
        </Alert>
      )}

      {canTransfer && !showForm && (
        <Button onClick={() => setShowForm(true)} className="self-start">
          <Plus size={18} aria-hidden /> Trasladar dinero
        </Button>
      )}

      {showForm && canTransfer && (
        <Card className="p-5 sm:p-6">
          <TransferForm
            accounts={accounts}
            pockets={pockets}
            onDone={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </Card>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-foreground">
          Historial de traslados
        </h2>
        <TransferHistoryList items={items} />
      </section>
    </div>
  );
}
