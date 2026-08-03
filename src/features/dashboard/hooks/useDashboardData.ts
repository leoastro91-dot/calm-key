/**
 * Orquesta las lecturas del dashboard (LOVABLE-009).
 * No crea repositorios nuevos: reutiliza los ya existentes por feature.
 * Cada bloque falla de forma aislada — el consumidor decide qué mostrar.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { useWorkspace } from "@/features/identity/hooks/useWorkspace";
import { accountRepository } from "@/features/accounts/services/accountRepository";
import { pocketRepository } from "@/features/accounts/services/pocketRepository";
import { financialPeriodRepository } from "@/features/income/services/financialPeriodRepository";
import { financialProfileRepository } from "@/features/onboarding/services/financialProfileRepository";
import { budgetRepository } from "@/features/budget/services/budgetRepository";
import { budgetItemRepository } from "@/features/budget/services/budgetItemRepository";
import { categoryRepository } from "@/features/budget/services/categoryRepository";
import { expenseTransactionRepository } from "@/features/expenses/services/transactionRepository";
import { debtRepository } from "@/features/debts/services/debtRepository";
import type { Account, MoneyState, Pocket } from "@/features/accounts/domain/types";
import type {
  Block5030,
  BudgetItemWithCategory,
  Category,
} from "@/features/budget/domain/types";
import type { ExpenseRow } from "@/features/expenses/domain/types";
import type { Debt } from "@/features/debts/domain/types";
import type { ActivePeriod } from "@/features/income/domain/types";

export interface MoneyStateTotals {
  available: number;
  reserved: number;
  protected: number;
  committed: number;
  total: number;
}

export interface BlockAggregate {
  block: Block5030;
  projected: number;
  actual: number;
  items: BudgetItemWithCategory[]; // ordenados desc por actual_amount
}

export interface RecentExpense {
  id: string;
  amount: number;
  date: string;
  description: string | null;
  categoryName: string | null;
  affectsBudget: boolean;
}

export interface DebtsSummary {
  total: number;
  activeCount: number;
  nextPayment: {
    debt: Debt;
    daysUntil: number | null;
    dateLabel: string;
  } | null;
}

function daysBetween(fromIso: string, toIso: string): number {
  const [ys, ms, ds] = fromIso.split("-").map(Number);
  const [ye, me, de] = toIso.split("-").map(Number);
  const from = Date.UTC(ys, ms - 1, ds);
  const to = Date.UTC(ye, me - 1, de);
  return Math.round((to - from) / 86400000);
}

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Próximo día de pago >= hoy basado en payment_day, dentro de este mes o el siguiente. */
function nextPaymentDateFor(paymentDay: number): { iso: string; days: number } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const today = now.getDate();
  let year = y;
  let month = m;
  if (paymentDay < today) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  const lastDay = new Date(year, month + 1, 0).getDate();
  const day = Math.min(paymentDay, lastDay);
  const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { iso, days: daysBetween(todayIso(), iso) };
}

export function useDashboardData() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const enabled = Boolean(user && workspace);
  const uid = user?.id;
  const wsId = workspace?.id;

  const accountsQ = useQuery({
    queryKey: ["dashboard", "accounts", wsId],
    enabled,
    queryFn: async () => {
      const [accounts, pockets] = await Promise.all([
        accountRepository.listByWorkspace(uid!, wsId!),
        pocketRepository.listByWorkspace(uid!, wsId!),
      ]);
      return { accounts, pockets };
    },
  });

  const profileQ = useQuery({
    queryKey: ["dashboard", "profile", wsId],
    enabled,
    queryFn: () => financialProfileRepository.getByUser(uid!, wsId!),
  });

  const periodQ = useQuery({
    queryKey: ["dashboard", "period", wsId],
    enabled,
    queryFn: () => financialPeriodRepository.getActive(uid!, wsId!),
  });

  const period = periodQ.data ?? null;

  const budgetQ = useQuery({
    queryKey: ["dashboard", "budget", period?.id],
    enabled: enabled && Boolean(period?.id),
    queryFn: () =>
      budgetRepository.getOrCreateForActivePeriod({
        user_id: uid!,
        workspace_id: wsId!,
        financial_period_id: period!.id,
      }),
  });

  const budgetItemsQ = useQuery({
    queryKey: ["dashboard", "budget-items", budgetQ.data?.id],
    enabled: Boolean(budgetQ.data?.id),
    queryFn: () => budgetItemRepository.listByBudget(budgetQ.data!.id),
  });

  const categoriesQ = useQuery({
    queryKey: ["dashboard", "categories", wsId],
    enabled,
    queryFn: () => categoryRepository.listAvailable(uid!, wsId!),
  });

  const expensesQ = useQuery({
    queryKey: ["dashboard", "expenses", period?.id],
    enabled: enabled && Boolean(period?.id),
    queryFn: () =>
      expenseTransactionRepository.listByPeriod(uid!, wsId!, period!.id),
  });

  const debtsQ = useQuery({
    queryKey: ["dashboard", "debts", wsId],
    enabled,
    queryFn: () => debtRepository.listByWorkspace(uid!, wsId!),
  });

  const currency = useMemo(() => {
    const accts = accountsQ.data?.accounts ?? [];
    return (accts.find((a) => a.is_active) ?? accts[0])?.currency ?? "COP";
  }, [accountsQ.data]);

  const patrimony = useMemo(() => {
    const accts: Account[] = accountsQ.data?.accounts ?? [];
    return accts
      .filter((a) => a.is_active && a.include_in_total)
      .reduce((s, a) => s + Number(a.current_balance), 0);
  }, [accountsQ.data]);

  const moneyStateTotals: MoneyStateTotals = useMemo(() => {
    const t: MoneyStateTotals = {
      available: 0,
      reserved: 0,
      protected: 0,
      committed: 0,
      total: 0,
    };
    if (!accountsQ.data) return t;
    const acctById = new Map<string, Account>(
      accountsQ.data.accounts.map((a) => [a.id, a]),
    );
    for (const p of accountsQ.data.pockets) {
      if (!p.is_active) continue;
      const acct = acctById.get(p.account_id);
      if (!acct || !acct.is_active || !acct.include_in_total) continue;
      const key = p.money_state as MoneyState;
      t[key] += Number(p.balance);
      t.total += Number(p.balance);
    }
    return t;
  }, [accountsQ.data]);

  const enrichedItems: BudgetItemWithCategory[] = useMemo(() => {
    const items = budgetItemsQ.data ?? [];
    const cats = categoriesQ.data ?? [];
    const byId = new Map<string, Category>(cats.map((c) => [c.id, c]));
    return items.map((it) => {
      const c = byId.get(it.category_id) ?? null;
      return {
        ...it,
        category: c
          ? { id: c.id, name: c.name, block_5030: c.block_5030 }
          : null,
      };
    });
  }, [budgetItemsQ.data, categoriesQ.data]);

  const blocks: Record<Block5030, BlockAggregate> = useMemo(() => {
    const empty = (block: Block5030): BlockAggregate => ({
      block,
      projected: 0,
      actual: 0,
      items: [],
    });
    const acc: Record<Block5030, BlockAggregate> = {
      needs: empty("needs"),
      wants: empty("wants"),
      construction: empty("construction"),
    };
    for (const it of enrichedItems) {
      const b = it.category?.block_5030;
      if (!b) continue;
      acc[b].projected += Number(it.projected_amount);
      acc[b].actual += Number(it.actual_amount);
      acc[b].items.push(it);
    }
    (Object.keys(acc) as Block5030[]).forEach((b) => {
      acc[b].items.sort(
        (a, z) => Number(z.actual_amount) - Number(a.actual_amount),
      );
    });
    return acc;
  }, [enrichedItems]);

  const totalActual = useMemo(
    () => blocks.needs.actual + blocks.wants.actual + blocks.construction.actual,
    [blocks],
  );

  const recentExpenses: RecentExpense[] = useMemo(() => {
    const rows: ExpenseRow[] = expensesQ.data ?? [];
    const cats = categoriesQ.data ?? [];
    const byId = new Map<string, Category>(cats.map((c) => [c.id, c]));
    return rows.slice(0, 5).map((r) => ({
      id: r.id,
      amount: Number(r.amount),
      date: r.date,
      description: r.description,
      categoryName: r.category_id
        ? (byId.get(r.category_id)?.name ?? null)
        : null,
      affectsBudget: Boolean(r.affects_budget),
    }));
  }, [expensesQ.data, categoriesQ.data]);

  /** Gasto del período pagado con fondos acumulados (no consume presupuesto). */
  const fundUsageTotal = useMemo(() => {
    const rows: ExpenseRow[] = expensesQ.data ?? [];
    return rows
      .filter((r) => !r.affects_budget)
      .reduce((s, r) => s + Number(r.amount), 0);
  }, [expensesQ.data]);


  const debtsSummary: DebtsSummary = useMemo(() => {
    const debts: Debt[] = debtsQ.data ?? [];
    const active = debts.filter((d) => d.status === "active");
    const total = active.reduce((s, d) => s + Number(d.current_balance), 0);
    let next: DebtsSummary["nextPayment"] = null;
    for (const d of active) {
      if (!d.payment_day) continue;
      const { iso, days } = nextPaymentDateFor(d.payment_day);
      if (!next || days < next.daysUntil!) {
        next = { debt: d, daysUntil: days, dateLabel: iso };
      }
    }
    return { total, activeCount: active.length, nextPayment: next };
  }, [debtsQ.data]);

  const periodDaysRemaining = useMemo(() => {
    if (!period) return null;
    return Math.max(0, daysBetween(todayIso(), period.end_date));
  }, [period]);

  return {
    currency,
    patrimony,
    moneyStateTotals,
    period: period as ActivePeriod | null,
    periodDaysRemaining,
    profile: profileQ.data ?? null,
    blocks,
    totalActual,
    recentExpenses,
    debtsSummary,
    status: {
      accounts: {
        loading: accountsQ.isPending,
        error: accountsQ.isError,
      },
      period: { loading: periodQ.isPending, error: periodQ.isError },
      profile: { loading: profileQ.isPending, error: profileQ.isError },
      budget: {
        loading: budgetQ.isPending || budgetItemsQ.isPending || categoriesQ.isPending,
        error: budgetQ.isError || budgetItemsQ.isError || categoriesQ.isError,
      },
      expenses: { loading: expensesQ.isPending, error: expensesQ.isError },
      debts: { loading: debtsQ.isPending, error: debtsQ.isError },
    },
  };
}

export type DashboardData = ReturnType<typeof useDashboardData>;
