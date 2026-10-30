import { ArrowRightLeft, ShieldAlert, Inbox } from "lucide-react";
import { Card } from "@/features/shared/components/Card";
import { formatMoney } from "@/features/accounts/domain/types";
import { formatDateEs } from "@/features/income/domain/types";
import { useState } from "react";
import { Button } from "@/features/shared/components/Button";
import { useDeleteTransfer } from "../hooks/useDeleteTransfer";
import type { TransferHistoryItem } from "../domain/types";

interface Props {
  items: TransferHistoryItem[];
}

export function TransferHistoryList({ items }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const del = useDeleteTransfer();
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
            <Card className="flex flex-col gap-3 p-4">
            <div className="flex items-start gap-3">
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
            </div>
            {confirmId === it.id ? (
              <div className="flex flex-col gap-2 rounded-md bg-muted p-3">
                <p className="text-xs text-foreground">
                  ¿Reversar este traslado? El dinero vuelve a {fromLabel}.
                </p>
                {del.isError && (
                  <p className="text-xs text-destructive">
                    {del.error instanceof Error && del.error.message === "DEST_INSUFFICIENT"
                      ? "El bolsillo destino ya no tiene ese dinero disponible."
                      : "No se pudo reversar. Intenta de nuevo."}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    loading={del.isPending}
                    onClick={() => del.mutate(it, { onSuccess: () => setConfirmId(null) })}
                  >
                    Sí, reversar
                  </Button>
                  <Button variant="ghost" onClick={() => { setConfirmId(null); del.reset(); }}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="self-end text-xs font-medium text-primary underline-offset-2 hover:underline"
                onClick={() => { del.reset(); setConfirmId(it.id); }}
              >
                Reversar
              </button>
            )}
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
