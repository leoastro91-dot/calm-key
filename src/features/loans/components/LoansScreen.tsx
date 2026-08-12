import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { formatMoney } from "@/features/accounts/domain/types";
import { expectedReturnAmount } from "../domain/types";
import { Alert } from "@/features/shared/components/Alert";
import { Button } from "@/features/shared/components/Button";
import { Card } from "@/features/shared/components/Card";
import { Spinner } from "@/features/shared/components/Spinner";
import { useLoans } from "../hooks/useLoans";
import { CreateLoanForm } from "./CreateLoanForm";
import { LoanList } from "./LoanList";

export function LoansScreen() {
  const {
    activeLoans,
    paidLoans,
    accounts,
    pockets,
    isLoading,
    isError,
    refetch,
  } = useLoans();
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<"active" | "paid">("active");

  if (isLoading) {
    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">
          Cargando tus préstamos…
        </p>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="flex flex-col gap-4">
        <Alert variant="error">
          No pudimos cargar tus préstamos. Revisa tu conexión e intenta de
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
      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="self-start">
          <Plus size={18} aria-hidden /> Prestar dinero
        </Button>
      )}

      {showForm && (
        <Card className="p-5 sm:p-6">
          <CreateLoanForm
            accounts={accounts}
            pockets={pockets}
            onDone={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </Card>
      )}

      <div
        className="flex gap-2 rounded-lg bg-muted p-1"
        role="tablist"
        aria-label="Filtro de préstamos"
      >
        {(
          [
            ["active", `Activos (${activeLoans.length})`],
            ["paid", `Pagados (${paidLoans.length})`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={
              tab === value
                ? "flex-1 rounded-md bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm"
                : "flex-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground"
            }
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "active" ? (
        <LoanList
          title="Préstamos activos"
          loans={activeLoans}
          accounts={accounts}
          pockets={pockets}
          emptyText="Aún no tienes préstamos activos. Cuando le prestes dinero a alguien, aparecerá aquí."
        />
      ) : (
        <LoanList
          title="Préstamos pagados"
          loans={paidLoans}
          accounts={accounts}
          pockets={pockets}
          emptyText="Todavía no has registrado devoluciones."
        />
      )}
    </div>
  );
}
