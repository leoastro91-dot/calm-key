import { useState } from "react";
import { Inbox, ArrowDownCircle, Undo2 } from "lucide-react";
import { Button } from "@/features/shared/components/Button";
import { useDeleteIncome } from "../hooks/useDeleteIncome";
import { Card } from "@/features/shared/components/Card";
import {
  formatDateEs,
  INCOME_SOURCE_TYPE_LABELS,
  type ActivePeriod,
  type PeriodIncomeWithSource,
} from "../domain/types";
import { formatMoney } from "@/features/accounts/domain/types";

interface Props {
  incomes: PeriodIncomeWithSource[];
  accountNamesById: Record<string, string>;
  pocketNamesById: Record<string, { name: string; account_id: string }>;
  transactionDestinations: Record<
    string,
    { account_id: string; pocket_id: string }
  >;
  currency: string;
  period: ActivePeriod;
}

export function IncomeList({
  incomes,
  accountNamesById,
  pocketNamesById,
  transactionDestinations,
  currency,
  period,
}: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const del = useDeleteIncome();

  if (incomes.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 p-8 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Inbox size={22} aria-hidden />
        </span>
        <p className="text-sm font-medium text-foreground">
          Aún no has registrado ingresos en este período.
        </p>
        <p className="text-sm text-muted-foreground">
          Cuando recibas tu salario o cualquier otro ingreso, regístralo para
          mantener tu período al día.
        </p>
      </Card>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {incomes.map((inc) => {
        const dest = transactionDestinations[inc.transaction_id];
        const pocket = dest ? pocketNamesById[dest.pocket_id] : undefined;
        const accountName = dest
          ? accountNamesById[dest.account_id]
          : undefined;
        const sourceName = inc.income_source?.name ?? "Ingreso";
        const typeLabel = inc.income_source
          ? INCOME_SOURCE_TYPE_LABELS[inc.income_source.source_type]
          : null;
        const isConfirming = confirmId === inc.id;
        const isDeleting = del.isPending && del.variables?.period_income_id === inc.id;
        return (
          <li key={inc.id}>
            <Card className="flex flex-col gap-3 p-4 sm:p-4">
             <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                <ArrowDownCircle size={20} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {sourceName}
                  {typeLabel && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      · {typeLabel}
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatDateEs(inc.received_date)}
                  {accountName && pocket
                    ? ` · ${accountName} / ${pocket.name}`
                    : ""}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-success tabular-numbers">
                +{formatMoney(Number(inc.amount_received), currency)}
              </p>
             </div>
             <div className="flex flex-wrap items-center justify-end gap-2">
               {isConfirming ? (
                 <>
                   <span className="mr-auto text-xs text-muted-foreground">
                     Se descontará del bolsillo, la cuenta y el total del período.
                   </span>
                   <Button
                     variant="ghost"
                     onClick={() => setConfirmId(null)}
                     disabled={isDeleting}
                   >
                     Cancelar
                   </Button>
                   <Button
                     variant="destructive"
                     onClick={() =>
                       del.mutate(
                         {
                           period_income_id: inc.id,
                           transaction_id: inc.transaction_id,
                           amount: Number(inc.amount_received),
                           period,
                         },
                         { onSuccess: () => setConfirmId(null) },
                       )
                     }
                     disabled={isDeleting}
                   >
                     {isDeleting ? "Reversando…" : "Confirmar reversa"}
                   </Button>
                 </>
               ) : (
                 <Button variant="ghost" onClick={() => setConfirmId(inc.id)}>
                   <Undo2 size={16} aria-hidden /> Reversar
                 </Button>
               )}
             </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
