import { Inbox, ArrowDownCircle } from "lucide-react";
import { Card } from "@/features/shared/components/Card";
import {
  formatDateEs,
  INCOME_SOURCE_TYPE_LABELS,
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
}

export function IncomeList({
  incomes,
  accountNamesById,
  pocketNamesById,
  transactionDestinations,
  currency,
}: Props) {
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
        return (
          <li key={inc.id}>
            <Card className="flex items-center gap-3 p-4 sm:p-4">
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
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
