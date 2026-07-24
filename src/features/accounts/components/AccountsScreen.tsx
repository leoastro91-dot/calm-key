import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/features/shared/components/Card";
import { Button } from "@/features/shared/components/Button";
import { Alert } from "@/features/shared/components/Alert";
import { Spinner } from "@/features/shared/components/Spinner";
import { useWorkspace } from "@/features/identity/hooks/useWorkspace";
import { MoneyStateSummaryBar } from "./MoneyStateSummaryBar";
import { AccountCard } from "./AccountCard";
import { CreateAccountForm } from "./CreateAccountForm";
import { useAccountsData } from "../hooks/useAccountsData";

export function AccountsScreen() {
  const { profile } = useWorkspace();
  const { grouped, totals, isLoading, isError, refetch } = useAccountsData();
  const [creating, setCreating] = useState(false);

  const currency = useMemo(() => {
    const active = grouped.find((g) => g.account.is_active && g.account.include_in_total);
    return active?.account.currency ?? profile?.currency ?? "COP";
  }, [grouped, profile]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">Cargando tus cuentas…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="flex flex-col gap-4">
        <Alert variant="error">
          No pudimos cargar tus cuentas. Revisa tu conexión e intenta de nuevo.
        </Alert>
        <Button onClick={() => refetch()} fullWidth>
          Reintentar
        </Button>
      </Card>
    );
  }

  const activeAccounts = grouped.filter((g) => g.account.is_active);

  return (
    <div className="flex flex-col gap-5">
      <MoneyStateSummaryBar totals={totals} currency={currency} />

      {activeAccounts.length === 0 && !creating && (
        <Card className="flex flex-col items-center gap-4 py-10 text-center">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Aún no tienes cuentas
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Empieza registrando la cuenta donde tienes tu dinero hoy.
            </p>
          </div>
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} aria-hidden /> Agregar cuenta
          </Button>
        </Card>
      )}

      <div className="flex flex-col gap-4">
        {grouped.map((g) => (
          <AccountCard key={g.account.id} data={g} />
        ))}
      </div>

      {creating ? (
        <Card>
          <CreateAccountForm
            defaultCurrency={currency}
            onDone={() => setCreating(false)}
            onCancel={() => setCreating(false)}
          />
        </Card>
      ) : (
        activeAccounts.length > 0 && (
          <Button
            variant="secondary"
            onClick={() => setCreating(true)}
            fullWidth
          >
            <Plus size={16} aria-hidden /> Agregar cuenta
          </Button>
        )
      )}
    </div>
  );
}
