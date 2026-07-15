import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card } from "@/features/shared/components/Card";
import { Button } from "@/features/shared/components/Button";
import { Alert } from "@/features/shared/components/Alert";
import { Spinner } from "@/features/shared/components/Spinner";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { useWorkspace } from "@/features/identity/hooks/useWorkspace";
import { profileRepository } from "@/features/identity/services/profileRepository";
import { useOnboardingWizard, TOTAL_STEPS } from "../hooks/useOnboardingWizard";
import { useCompleteOnboarding } from "../hooks/useCompleteOnboarding";
import { OnboardingProgressBar } from "./OnboardingProgressBar";
import { StepIncomeSource } from "./StepIncomeSource";
import { StepAllocation5030 } from "./StepAllocation5030";
import { StepFinancialCycle } from "./StepFinancialCycle";
import { StepFirstAccount } from "./StepFirstAccount";
import { StepFirstPocket } from "./StepFirstPocket";
import { StepConfirmation } from "./StepConfirmation";

export function OnboardingWizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, workspace, isLoading: identityLoading } = useWorkspace();

  const defaultCurrency = profile?.currency ?? "COP";
  const { state, dispatch, next, back, canContinue, allocationSum } =
    useOnboardingWizard(defaultCurrency);
  const { run, loading, errorMsg } = useCompleteOnboarding();

  // Sincronizar moneda por defecto en cuanto llegue el perfil.
  useEffect(() => {
    if (profile && !state.account.currency) {
      dispatch({ type: "patchAccount", value: { currency: profile.currency } });
    }
  }, [profile, state.account.currency, dispatch]);

  // Si ya está activo, no volver a mostrar el wizard.
  useEffect(() => {
    if (profile?.account_status === "active") {
      navigate({ to: "/bienvenida" });
    }
  }, [profile, navigate]);

  if (identityLoading || !user || !workspace || !profile) {
    return (
      <Card className="flex flex-col items-center gap-3 py-10">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">Cargando tu cuenta…</p>
      </Card>
    );
  }

  const handleConfirm = async () => {
    const ok = await run(state);
    if (ok) navigate({ to: "/onboarding/completado" });
  };

  const isLastStep = state.step === TOTAL_STEPS;
  const isPocketStep = state.step === 5;

  return (
    <Card className="flex flex-col gap-6">
      <OnboardingProgressBar current={state.step} />

      {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

      {state.step === 1 && (
        <StepIncomeSource
          value={state.income}
          onChange={(v) => dispatch({ type: "patchIncome", value: v })}
        />
      )}
      {state.step === 2 && (
        <StepAllocation5030
          value={state.allocation}
          sum={allocationSum}
          onChange={(v) => dispatch({ type: "patchAllocation", value: v })}
        />
      )}
      {state.step === 3 && (
        <StepFinancialCycle
          value={state.cycle}
          onChange={(v) => dispatch({ type: "patchCycle", value: v })}
        />
      )}
      {state.step === 4 && (
        <StepFirstAccount
          value={state.account}
          onChange={(v) => dispatch({ type: "patchAccount", value: v })}
        />
      )}
      {state.step === 5 && (
        <StepFirstPocket
          value={state.pocket}
          currency={state.account.currency}
          onChange={(v) => dispatch({ type: "patchPocket", value: v })}
        />
      )}
      {state.step === 6 && <StepConfirmation state={state} />}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        {state.step > 1 ? (
          <Button variant="ghost" onClick={back} disabled={loading}>
            Atrás
          </Button>
        ) : (
          <span />
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          {isPocketStep && (
            <Button
              variant="secondary"
              onClick={() => dispatch({ type: "skipPocket" })}
              disabled={loading}
            >
              Omitir por ahora
            </Button>
          )}
          {isLastStep ? (
            <Button onClick={handleConfirm} loading={loading} disabled={loading}>
              Empezar a usar Finance OS
            </Button>
          ) : (
            <Button onClick={next} disabled={!canContinue || loading}>
              Continuar
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

/** Guard para /onboarding/completado — verifica que el perfil quedó activo. */
export function useEnsureActiveProfile() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    // Best-effort: refrescar el estado del perfil silenciosamente.
    profileRepository.getById(user.id).catch(() => {});
  }, [user]);
}
