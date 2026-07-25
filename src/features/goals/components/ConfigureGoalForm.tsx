import { useMemo, useState } from "react";
import { Input } from "@/features/shared/components/Input";
import { Button } from "@/features/shared/components/Button";
import { Alert } from "@/features/shared/components/Alert";
import { OnboardingSelect } from "@/features/onboarding/components/OnboardingSelect";
import { useToast } from "@/features/shared/components/Toast";
import {
  formatMoney,
  parseMoneyInput,
  type Pocket,
} from "@/features/accounts/domain/types";
import type { Account } from "@/features/accounts/domain/types";
import { useConfigureGoal } from "../hooks/useConfigureGoal";

interface Props {
  pockets: Pocket[];
  accountsById: Map<string, Account>;
  currency: string;
  /** Bolsillo preseleccionado en modo edición. */
  initialPocket?: Pocket | null;
  onDone: () => void;
  onCancel: () => void;
}

export function ConfigureGoalForm({
  pockets,
  accountsById,
  currency,
  initialPocket,
  onDone,
  onCancel,
}: Props) {
  const [pocketId, setPocketId] = useState<string>(
    initialPocket?.id ?? pockets[0]?.id ?? "",
  );
  const [amount, setAmount] = useState<string>(() => {
    if (initialPocket?.target_amount != null) {
      return String(initialPocket.target_amount);
    }
    return "";
  });
  const [error, setError] = useState<string | null>(null);
  const configure = useConfigureGoal();
  const { toast } = useToast();

  const options = useMemo(
    () =>
      pockets.map((p) => {
        const acct = accountsById.get(p.account_id);
        return {
          value: p.id,
          label: `${p.name} — ${acct?.name ?? "cuenta"} (${formatMoney(Number(p.balance), acct?.currency ?? currency)})`,
        };
      }),
    [pockets, accountsById, currency],
  );

  const selected = pockets.find((p) => p.id === pocketId) ?? null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!pocketId) return setError("Elige un bolsillo.");
    const parsed = parseMoneyInput(amount);
    if (parsed == null || parsed <= 0) {
      return setError("El monto objetivo debe ser mayor a 0.");
    }
    try {
      await configure.mutateAsync({
        pocket_id: pocketId,
        target_amount: parsed,
      });
      toast(
        initialPocket ? "Meta actualizada." : "Meta configurada.",
        "success",
      );
      onDone();
    } catch (err) {
      console.error(err);
      setError("No pudimos guardar la meta. Intenta de nuevo.");
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <h4 className="text-base font-semibold text-foreground">
        {initialPocket ? "Editar meta" : "Configurar meta"}
      </h4>
      {error && <Alert variant="error">{error}</Alert>}

      {initialPocket ? (
        <div className="rounded-lg bg-muted px-3 py-2 text-sm">
          <div className="font-medium text-foreground">
            {initialPocket.name}
          </div>
          <div className="text-xs text-muted-foreground">
            {accountsById.get(initialPocket.account_id)?.name}
          </div>
        </div>
      ) : options.length === 0 ? (
        <Alert variant="info">
          Todos tus bolsillos ya tienen una meta configurada. Puedes editar la
          existente o quitarla.
        </Alert>
      ) : (
        <OnboardingSelect
          label="Bolsillo"
          value={pocketId}
          onChange={(e) => setPocketId(e.target.value)}
          options={options}
        />
      )}

      <Input
        label="Monto objetivo"
        placeholder="Ej. 2.500.000"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        inputMode="decimal"
      />

      {selected && (
        <p className="text-xs text-muted-foreground">
          Saldo actual del bolsillo:{" "}
          <strong className="text-foreground tabular-numbers">
            {formatMoney(Number(selected.balance), currency)}
          </strong>
          . El progreso se calcula solo desde este saldo — no se crea ninguna
          transacción.
        </p>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={configure.isPending}
          disabled={!pocketId}
          className="flex-1"
        >
          Guardar meta
        </Button>
      </div>
    </form>
  );
}
