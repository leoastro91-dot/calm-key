import { useMemo } from "react";
import { OnboardingSelect } from "@/features/onboarding/components/OnboardingSelect";
import {
  formatMoney,
  MONEY_STATE_LABELS,
} from "@/features/accounts/domain/types";
import type { Account, Pocket } from "@/features/accounts/domain/types";

interface Props {
  label: string;
  accounts: Account[];
  pockets: Pocket[];
  accountId: string;
  pocketId: string;
  onChangeAccount: (id: string) => void;
  onChangePocket: (id: string) => void;
  /** Bolsillo a excluir del dropdown de destino (evita traslado a sí mismo). */
  excludePocketId?: string;
  currency?: string;
}

export function PocketSelector({
  label,
  accounts,
  pockets,
  accountId,
  pocketId,
  onChangeAccount,
  onChangePocket,
  excludePocketId,
  currency,
}: Props) {
  const accountOptions = useMemo(
    () =>
      accounts
        .filter((a) => a.is_active)
        .map((a) => ({ value: a.id, label: a.name })),
    [accounts],
  );

  const pocketOptions = useMemo(
    () =>
      pockets
        .filter(
          (p) =>
            p.is_active &&
            p.account_id === accountId &&
            p.id !== excludePocketId,
        )
        .map((p) => ({
          value: p.id,
          label: `${p.name} — ${MONEY_STATE_LABELS[p.money_state]} (${formatMoney(Number(p.balance), currency ?? accounts.find((a) => a.id === accountId)?.currency ?? "COP")})`,
        })),
    [pockets, accountId, excludePocketId, accounts, currency],
  );

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/40 p-3">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <OnboardingSelect
        label="Cuenta"
        options={
          accountOptions.length > 0
            ? accountOptions
            : [{ value: "", label: "Sin cuentas activas" }]
        }
        value={accountId}
        onChange={(e) => onChangeAccount(e.target.value)}
      />
      <OnboardingSelect
        label="Bolsillo"
        options={
          pocketOptions.length > 0
            ? pocketOptions
            : [{ value: "", label: "Sin bolsillos disponibles" }]
        }
        value={pocketId}
        onChange={(e) => onChangePocket(e.target.value)}
      />
    </div>
  );
}
