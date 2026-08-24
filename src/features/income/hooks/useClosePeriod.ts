/**
 * Cierre de ciclo y apertura del siguiente período (LOVABLE — cambio de ciclo).
 *
 * Qué se traslada:
 *   - Saldos de cuentas y bolsillos (ahorros acumulados): viven en pockets,
 *     no en el período → se conservan tal cual, sin tocarlos.
 *   - Deudas y préstamos: viven en debts / loans → se conservan tal cual.
 *   - El presupuesto del nuevo período se crea vacío al entrar a /presupuesto
 *     (budgetRepository.getOrCreateForActivePeriod).
 *
 * Secuencia:
 *   1. UPDATE financial_periods (actual) SET status='closed'.
 *   2. INSERT financial_periods (nuevo, status='active').
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { useWorkspace } from "@/features/identity/hooks/useWorkspace";
import { accountRepository } from "@/features/accounts/services/accountRepository";
import { pocketRepository } from "@/features/accounts/services/pocketRepository";
import { debtRepository } from "@/features/debts/services/debtRepository";
import { financialPeriodRepository } from "../services/financialPeriodRepository";
import { incomeSourceRepository } from "../services/incomeSourceRepository";
import {
  calculateEndDate,
  toISODate,
} from "@/features/onboarding/domain/types";
import type { ActivePeriod, PeriodType } from "../domain/types";

/** Fecha de inicio sugerida: el día siguiente al fin del período actual. */
export function nextStartDate(endDate: string): string {
  const [y, m, d] = endDate.split("-").map(Number);
  const dt = new Date(y ?? 1970, (m ?? 1) - 1, (d ?? 1) + 1);
  return toISODate(dt);
}

export function suggestedEndDate(
  periodType: PeriodType,
  startDate: string,
): string {
  const [y, m, d] = startDate.split("-").map(Number);
  const dt = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  return toISODate(calculateEndDate(periodType, dt));
}

/** Resumen de lo que se traslada al nuevo ciclo (solo lectura). */
export function useCarryoverSummary() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: ["income", "carryover", workspace?.id],
    enabled: Boolean(user && workspace),
    queryFn: async () => {
      const [accounts, pockets, debts, sources] = await Promise.all([
        accountRepository.listByWorkspace(user!.id, workspace!.id),
        pocketRepository.listByWorkspace(user!.id, workspace!.id),
        debtRepository.listByWorkspace(user!.id, workspace!.id),
        incomeSourceRepository.listByWorkspace(user!.id, workspace!.id),
      ]);
      const activePockets = pockets.filter((p) => p.is_active);
      const patrimony = accounts
        .filter((a) => a.is_active && a.include_in_total)
        .reduce((s, a) => s + Number(a.current_balance), 0);
      const savings = activePockets
        .filter(
          (p) =>
            p.money_state === "reserved" ||
            p.money_state === "protected" ||
            p.target_amount !== null,
        )
        .reduce((s, p) => s + Number(p.balance), 0);
      const activeDebts = debts.filter((d) => d.status === "active");
      const debtBalance = activeDebts.reduce(
        (s, d) => s + Number(d.current_balance),
        0,
      );
      const expectedIncome = sources
        .filter((s) => s.is_active)
        .reduce((s, src) => s + Number(src.expected_amount), 0);
      return {
        currency: accounts.find((a) => a.is_active)?.currency ?? "COP",
        patrimony,
        savings,
        savingsPockets: activePockets.filter(
          (p) =>
            p.money_state === "reserved" ||
            p.money_state === "protected" ||
            p.target_amount !== null,
        ).length,
        debtBalance,
        debtCount: activeDebts.length,
        expectedIncome,
      };
    },
  });
}

export interface ClosePeriodInput {
  period: ActivePeriod;
  period_type: PeriodType;
  start_date: string;
  end_date: string;
  expected_income: number;
}

export function useClosePeriod() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: ClosePeriodInput) => {
      if (!user || !workspace) throw new Error("SESSION_NOT_READY");
      if (input.end_date <= input.start_date) {
        throw new Error("INVALID_DATE_RANGE");
      }

      await financialPeriodRepository.close(input.period.id);

      const created = await financialPeriodRepository.createActive({
        user_id: user.id,
        workspace_id: workspace.id,
        period_type: input.period_type,
        start_date: input.start_date,
        end_date: input.end_date,
        expected_income: input.expected_income,
      });
      return created;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["income"] });
      qc.invalidateQueries({ queryKey: ["budget"] });
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
