/**
 * Orquesta la escritura secuencial del Paso 6 (Sección 12.1).
 * Cada paso es idempotente — un reintento tras fallo parcial no
 * duplica filas gracias a las restricciones UNIQUE de la base de datos.
 */
import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { useWorkspace } from "@/features/identity/hooks/useWorkspace";
import { profileRepository } from "@/features/identity/services/profileRepository";
import { financialProfileRepository } from "../services/financialProfileRepository";
import { incomeSourceRepository } from "../services/incomeSourceRepository";
import { accountRepository } from "../services/accountRepository";
import { pocketRepository } from "../services/pocketRepository";
import { transactionRepository } from "../services/transactionRepository";
import { financialPeriodRepository } from "../services/financialPeriodRepository";
import {
  calculateEndDate,
  toISODate,
  type PeriodType,
  type AccountType,
  type IncomeSourceType,
  type MoneyState,
} from "../domain/types";
import { parseAmount, type OnboardingState } from "./useOnboardingWizard";
import { getSupabase } from "@/features/shared/services/supabaseClient";

const STEP_LABELS = [
  "guardando tu perfil financiero",
  "guardando tu ingreso principal",
  "creando tu primera cuenta",
  "registrando tu saldo inicial",
  "creando tu primer bolsillo",
  "registrando el saldo del bolsillo",
  "abriendo tu primer período",
  "finalizando tu configuración",
  "activando tu cuenta",
];

export function useCompleteOnboarding() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [failedStep, setFailedStep] = useState<number | null>(null);

  const run = useCallback(
    async (form: OnboardingState): Promise<boolean> => {
      if (!user || !workspace) {
        setErrorMsg("Tu sesión no está lista. Inténtalo de nuevo en un momento.");
        return false;
      }
      setLoading(true);
      setErrorMsg(null);
      setFailedStep(null);

      const userId = user.id;
      const workspaceId = workspace.id;
      const incomeAmount = parseAmount(form.income.expected_amount);
      const accountBalance = parseAmount(form.account.opening_balance);
      const pocketBalance = form.pocket.skipped
        ? 0
        : parseAmount(form.pocket.balance || "0");

      let current = 0;
      try {
        // 1. financial_profiles
        current = 0;
        const fp = await financialProfileRepository.createOrGet({
          user_id: userId,
          workspace_id: workspaceId,
          monthly_income: incomeAmount,
          needs_pct: form.allocation.needs_pct,
          wants_pct: form.allocation.wants_pct,
          construction_pct: form.allocation.construction_pct,
          period_type: form.cycle.period_type as PeriodType,
          period_cycle_start_day:
            form.cycle.period_type === "monthly" ||
            form.cycle.period_type === "biweekly"
              ? Number(form.cycle.period_cycle_start_day)
              : null,
        });

        // 2. income_sources
        current = 1;
        await incomeSourceRepository.createOrGetPrimary({
          user_id: userId,
          workspace_id: workspaceId,
          name: form.income.name.trim(),
          source_type: form.income.source_type as IncomeSourceType,
          expected_amount: incomeAmount,
        });

        // 3. accounts — verificar existencia por nombre para idempotencia básica
        current = 2;
        const existingAccounts = await accountRepository.listByUser(
          userId,
          workspaceId,
        );
        const accountName = form.account.name.trim();
        let account =
          existingAccounts.find((a) => a.name === accountName) ?? null;
        if (!account) {
          account = await accountRepository.create({
            user_id: userId,
            workspace_id: workspaceId,
            name: accountName,
            type: form.account.type as AccountType,
            currency: form.account.currency,
            opening_balance: accountBalance,
          });
        }

        // 4. transactions (opening_balance de la cuenta) — solo si > 0
        current = 3;
        if (accountBalance > 0) {
          // Idempotencia: no volver a insertar si ya existe un opening_balance
          // de onboarding para esta cuenta sin pocket.
          const { data: existingTx, error: exErr } = await getSupabase()
            .from("transactions")
            .select("id")
            .eq("account_id", account.id)
            .eq("type", "opening_balance")
            .is("pocket_id", null)
            .eq("is_onboarding_entry", true)
            .maybeSingle();
          if (exErr) throw exErr;
          if (!existingTx) {
            await transactionRepository.createOpeningBalance({
              user_id: userId,
              workspace_id: workspaceId,
              amount: accountBalance,
              date: toISODate(new Date()),
              account_id: account.id,
              pocket_id: null,
            });
          }
        }

        // 5. pockets (opcional)
        current = 4;
        let pocketId: string | null = null;
        if (!form.pocket.skipped) {
          const pocket = await pocketRepository.create({
            account_id: account.id,
            user_id: userId,
            workspace_id: workspaceId,
            name: form.pocket.name.trim(),
            money_state: form.pocket.money_state as MoneyState,
            balance: pocketBalance,
          });
          pocketId = pocket.id;
        }

        // 6. transactions (opening_balance del bolsillo) — solo si Y > 0
        current = 5;
        if (pocketId && pocketBalance > 0) {
          await transactionRepository.createOpeningBalance({
            user_id: userId,
            workspace_id: workspaceId,
            amount: pocketBalance,
            date: toISODate(new Date()),
            account_id: account.id,
            pocket_id: pocketId,
          });
        }

        // 7. financial_periods
        current = 6;
        const startDate = new Date();
        let endDate: Date;
        if (form.cycle.period_type === "custom") {
          endDate = new Date(form.cycle.custom_end_date);
        } else {
          endDate = calculateEndDate(
            form.cycle.period_type as PeriodType,
            startDate,
          );
        }
        await financialPeriodRepository.createOrGetActive({
          user_id: userId,
          workspace_id: workspaceId,
          period_type: form.cycle.period_type as PeriodType,
          start_date: toISODate(startDate),
          end_date: toISODate(endDate),
          expected_income: incomeAmount,
        });

        // 8. financial_profiles.onboarding_completed = true
        current = 7;
        await financialProfileRepository.markCompleted(fp.id);

        // 9. profiles.account_status = 'active'
        current = 8;
        const { error: upErr } = await getSupabase()
          .from("profiles")
          .update({ account_status: "active" })
          .eq("id", userId);
        if (upErr) throw upErr;

        // Invalidar caches que dependen del profile/workspace
        await qc.invalidateQueries({ queryKey: ["identity", "welcome"] });

        setLoading(false);
        return true;
      } catch (err) {
        console.error("Onboarding failed at step", current, err);
        setFailedStep(current + 1);
        setErrorMsg(
          `No pudimos terminar de configurar tu cuenta mientras estábamos ${STEP_LABELS[current]}. Tus datos no se perdieron — puedes reintentar.`,
        );
        setLoading(false);
        return false;
      }
    },
    [user, workspace, qc],
  );

  return { run, loading, errorMsg, failedStep };
}
