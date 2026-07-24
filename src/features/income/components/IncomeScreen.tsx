import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Alert } from "@/features/shared/components/Alert";
import { Button } from "@/features/shared/components/Button";
import { Card } from "@/features/shared/components/Card";
import { Spinner } from "@/features/shared/components/Spinner";
import {
  useAccountsAndPockets,
  useActivePeriod,
  useIncomeSources,
  usePeriodIncomes,
} from "../hooks/useIncomeData";
import { ActivePeriodHeader } from "./ActivePeriodHeader";
import { IncomeList } from "./IncomeList";
import { RegisterIncomeForm } from "./RegisterIncomeForm";
import { getSupabase } from "@/features/shared/services/supabaseClient";

/**
 * Enriquece la lista de ingresos con la cuenta/bolsillo destino de cada
 * transaction — necesario porque period_incomes no guarda ese destino
 * directamente (vive en transactions).
 */
function useTransactionDestinations(transactionIds: string[]) {
  const key = transactionIds.slice().sort().join(",");
  return useQuery({
    queryKey: ["income", "tx-destinations", key],
    enabled: transactionIds.length > 0,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("transactions")
        .select("id, account_id, pocket_id")
        .in("id", transactionIds);
      if (error) throw error;
      const map: Record<string, { account_id: string; pocket_id: string }> = {};
      for (const row of (data ?? []) as Array<{
        id: string;
        account_id: string;
        pocket_id: string;
      }>) {
        map[row.id] = {
          account_id: row.account_id,
          pocket_id: row.pocket_id,
        };
      }
      return map;
    },
  });
}

export function IncomeScreen() {
  const periodQ = useActivePeriod();
  const period = periodQ.data ?? null;
  const incomesQ = usePeriodIncomes(period?.id);
  const sourcesQ = useIncomeSources();
  const destsQ = useAccountsAndPockets();
  const [showForm, setShowForm] = useState(false);

  const transactionIds = useMemo(
    () => (incomesQ.data ?? []).map((i) => i.transaction_id),
    [incomesQ.data],
  );
  const txDestQ = useTransactionDestinations(transactionIds);

  if (periodQ.isPending) {
    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">Cargando tu período…</p>
      </Card>
    );
  }

  if (periodQ.isError) {
    return (
      <Alert variant="error">
        No pudimos cargar tu período financiero. Recarga la página o intenta más
        tarde.
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

  const primarySource =
    (sourcesQ.data ?? []).find((s) => s.is_primary) ?? null;
  const accounts = destsQ.data?.accounts ?? [];
  const pockets = destsQ.data?.pockets ?? [];
  const canRegister = accounts.length > 0 && pockets.length > 0;

  const accountNamesById = Object.fromEntries(
    accounts.map((a) => [a.id, a.name]),
  );
  const pocketNamesById = Object.fromEntries(
    pockets.map((p) => [p.id, { name: p.name, account_id: p.account_id }]),
  );
  // La moneda del período la asumimos de la primera cuenta activa (MVP —
  // single-currency por usuario en esta fase).
  const currency = accounts[0]?.currency ?? "COP";

  return (
    <div className="flex flex-col gap-5">
      <ActivePeriodHeader period={period} currency={currency} />

      {!canRegister && (
        <Alert variant="warning">
          Necesitas al menos una cuenta con un bolsillo activo para registrar
          ingresos.
        </Alert>
      )}

      {canRegister && !showForm && (
        <Button onClick={() => setShowForm(true)} className="self-start">
          <Plus size={18} aria-hidden /> Registrar ingreso
        </Button>
      )}

      {showForm && canRegister && (
        <Card className="p-5 sm:p-6">
          <RegisterIncomeForm
            period={period}
            primarySource={primarySource}
            accounts={accounts}
            pockets={pockets}
            onDone={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </Card>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-foreground">
          Ingresos del período
        </h2>
        {incomesQ.isPending ? (
          <Card className="flex justify-center py-6">
            <Spinner />
          </Card>
        ) : (
          <IncomeList
            incomes={incomesQ.data ?? []}
            accountNamesById={accountNamesById}
            pocketNamesById={pocketNamesById}
            transactionDestinations={txDestQ.data ?? {}}
            currency={currency}
          />
        )}
      </section>
    </div>
  );
}
