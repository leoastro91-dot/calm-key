import { Link } from "@tanstack/react-router";
import { Card } from "@/features/shared/components/Card";
import { formatMoney } from "@/features/accounts/domain/types";
import { formatDateEs } from "@/features/income/domain/types";
import type { RecentExpense } from "../hooks/useDashboardData";

interface Props {
  expenses: RecentExpense[];
  currency: string;
}

export function RecentExpensesList({ expenses, currency }: Props) {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-foreground">
          Gastos recientes
        </h2>
        <Link
          to="/gastos"
          className="text-xs font-medium text-primary hover:underline"
        >
          Ver todos →
        </Link>
      </div>
      {expenses.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aún no tienes gastos registrados este período.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {expenses.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between gap-3 py-2.5"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  {e.categoryName ?? e.description ?? "Gasto"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDateEs(e.date)}
                  {e.categoryName && e.description ? ` · ${e.description}` : ""}
                  {!e.affectsBudget ? " · Fondo acumulado" : ""}
                </span>
              </div>
              <span className="text-sm font-semibold text-foreground tabular-numbers">
                {formatMoney(e.amount, currency)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
