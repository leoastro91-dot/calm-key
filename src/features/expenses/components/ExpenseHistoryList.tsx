import { useState } from "react";
import { Receipt, Inbox, Tag, Undo2 } from "lucide-react";
import { Alert } from "@/features/shared/components/Alert";
import { Button } from "@/features/shared/components/Button";
import { useDeleteExpense } from "../hooks/useDeleteExpense";
import { Card } from "@/features/shared/components/Card";
import { formatMoney } from "@/features/accounts/domain/types";
import { formatDateEs } from "@/features/income/domain/types";
import {
  SPENDING_NATURE_LABELS,
  type ExpenseHistoryItem,
} from "../domain/types";

interface Props {
  items: ExpenseHistoryItem[];
}

export function ExpenseHistoryList({ items }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const del = useDeleteExpense();

  if (items.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 p-8 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Inbox size={22} aria-hidden />
        </span>
        <p className="text-sm font-medium text-foreground">
          Aún no has registrado gastos en este período.
        </p>
        <p className="text-sm text-muted-foreground">
          Cuando registres uno, aparecerá aquí ordenado del más reciente.
        </p>
      </Card>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((it) => {
        const source =
          it.account && it.pocket
            ? `${it.account.name} / ${it.pocket.name}`
            : "—";
        const currency = it.account?.currency ?? "COP";
        return (
          <li key={it.id}>
            <Card className="flex items-start gap-3 p-4">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                aria-hidden
              >
                <Receipt size={20} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {it.categoryName ?? "Sin categoría"}
                    {it.subcategoryName ? ` · ${it.subcategoryName}` : ""}
                  </p>
                  <p className="tabular-nums text-sm font-semibold text-destructive">
                    − {formatMoney(Number(it.amount), currency)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      it.affects_budget
                        ? "bg-primary/10 text-primary"
                        : "bg-accent/15 text-foreground"
                    }`}
                  >
                    {it.affects_budget ? "Presupuesto" : "Fondo acumulado"}
                  </span>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatDateEs(it.date)} · {source} ·{" "}
                    {SPENDING_NATURE_LABELS[it.spending_nature]}
                  </p>
                </div>

                {(it.description || it.event_tag) && (
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {it.description && (
                      <p className="text-xs text-muted-foreground">
                        {it.description}
                      </p>
                    )}
                    {it.event_tag && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        <Tag size={11} aria-hidden />
                        {it.event_tag}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-1">
                  {confirmId === it.id ? (
                    <>
                      <p className="text-xs text-muted-foreground">
                        ¿Reversar este gasto? El dinero vuelve a{" "}
                        {it.pocket?.name ?? "su bolsillo"} y se descuenta de la
                        ejecución del presupuesto.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => setConfirmId(null)}
                          disabled={del.isPending}
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={() =>
                            del.mutate(it, {
                              onSuccess: () => setConfirmId(null),
                            })
                          }
                          isLoading={del.isPending}
                        >
                          Sí, reversar
                        </Button>
                      </div>
                      {del.isError && (
                        <Alert variant="error">
                          No pudimos reversar el gasto. Intenta de nuevo.
                        </Alert>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmId(it.id)}
                      className="inline-flex w-fit items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Undo2 size={12} aria-hidden />
                      Reversar
                    </button>
                  )}
                </div>
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
