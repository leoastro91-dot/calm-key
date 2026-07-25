/**
 * Dominio del feature Metas por Bolsillo (LOVABLE-011).
 * Una meta es simplemente un `pockets.target_amount` no nulo.
 * El progreso se lee en vivo desde `pockets.balance` — no hay estado propio.
 */
import type { Account, Pocket } from "@/features/accounts/domain/types";

export interface GoalPocket {
  pocket: Pocket;
  account: Account;
  target: number;
  balance: number;
  /** Cap visual al 100% aunque el saldo supere la meta (CP-76). */
  progressPct: number;
  /** Sin capar: útil para ordenar y detectar metas cumplidas. */
  rawProgressPct: number;
  isComplete: boolean;
  remaining: number;
}

export function buildGoalPocket(pocket: Pocket, account: Account): GoalPocket {
  const target = Number(pocket.target_amount ?? 0);
  const balance = Number(pocket.balance);
  const raw = target > 0 ? (balance / target) * 100 : 0;
  return {
    pocket,
    account,
    target,
    balance,
    progressPct: Math.min(100, Math.max(0, raw)),
    rawProgressPct: raw,
    isComplete: target > 0 && balance >= target,
    remaining: Math.max(0, target - balance),
  };
}
