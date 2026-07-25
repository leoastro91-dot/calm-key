import { ArrowRightLeft, ShieldAlert, Inbox } from "lucide-react";
import { Card } from "@/features/shared/components/Card";
import { formatMoney } from "@/features/accounts/domain/types";
import { formatDateEs } from "@/features/income/domain/types";
import type { TransferHistoryItem } from "../domain/types";

interface Props {
  items: TransferHistoryItem[];
}

export function TransferHistoryList({ items }: Props) {
  if (items.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 p-8 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Inbox size={22} aria-hidden />
        </span>
        <p className="text-sm font-medium text-foreground">
          Aún no has registrado traslados.
        </p>
        <p className="text-sm text-muted-foreground">
          Cuando muevas dinero entre bolsillos o cuentas, aparecerá aquí.
        </p>
      </Card>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((it) => {
        const isEmergency = it.type === "emergency_use";
        const fromLabel = it.fromAccount && it.fromPocket
          ? `${it.fromAccount.name} / ${it.fromPocket.name}`
          : "—";
        const toLabel = it.toAccount && it.toPocket
          ? `${it.toAccount.name} / ${it.toPocket.name}`
          : "—";
        const currency = it.fromAccount?.currency ?? it.toAccount?.currency ?? "COP";
        return (
          <li key={it.id}>
            <Card className="flex items-start gap-3 p-4">
              <span
                className={
                  isEmergency
                    ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning"
                    : "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                }
                aria-hidden
              >
                {isEmergency ? <ShieldAlert size={20} /> : <ArrowRightLeft size={20} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {isEmergency ? "Uso de emergencia" : "Traslado"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {fromLabel} → {toLabel}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatDateEs(it.date)}
                  {it.category ? ` · ${it.category.name}` : ""}
                  {it.description ? ` · ${it.description}` : ""}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-foreground tabular-numbers">
                {formatMoney(Number(it.amount), currency)}
              </p>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
