import { useQuery } from "@tanstack/react-query";
import { HandCoins, Inbox } from "lucide-react";
import { Card } from "@/features/shared/components/Card";
import { Spinner } from "@/features/shared/components/Spinner";
import { formatMoney } from "@/features/accounts/domain/types";
import { formatDateEs } from "@/features/income/domain/types";
import type { Account, Pocket } from "@/features/accounts/domain/types";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { useWorkspace } from "@/features/identity/hooks/useWorkspace";
import { debtTransactionRepository } from "../services/transactionRepository";

interface Props {
  debtId: string;
  currency: string;
  accounts: Account[];
  pockets: Pocket[];
}

export function PaymentHistoryList({ debtId, currency, accounts, pockets }: Props) {
  const { user } = useAuth();
  const { workspace } = useWorkspace();

  const q = useQuery({
    queryKey: ["debts", "payments", debtId],
    enabled: Boolean(user && workspace && debtId),
    queryFn: () =>
      debtTransactionRepository.listByDebt(user!.id, workspace!.id, debtId),
  });

  if (q.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner size="sm" /> Cargando abonos…
      </div>
    );
  }

  const items = q.data ?? [];

  if (items.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 p-6 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Inbox size={22} aria-hidden />
        </span>
        <p className="text-sm font-medium text-foreground">
          Aún no has registrado abonos a esta deuda.
        </p>
      </Card>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((it) => {
        const acct = accounts.find((a) => a.id === it.account_id) ?? null;
        const pocket = pockets.find((p) => p.id === it.pocket_id) ?? null;
        const total = Number(it.amount);
        const interest = Number(it.interest_amount ?? 0);
        const capital = Math.max(0, total - interest);
        const source =
          acct && pocket ? `${acct.name} / ${pocket.name}` : "—";
        return (
          <li key={it.id}>
            <Card className="flex items-start gap-3 p-4">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                aria-hidden
              >
                <HandCoins size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  Abono
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatDateEs(it.date)} · {source}
                  {it.description ? ` · ${it.description}` : ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-destructive tabular-nums">
                  − {formatMoney(total, currency)}
                </p>
                <p className="text-[11px] text-muted-foreground tabular-nums">
                  Capital {formatMoney(capital, currency)}
                  {interest > 0
                    ? ` · Interés ${formatMoney(interest, currency)}`
                    : " · Sin interés"}
                </p>
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
