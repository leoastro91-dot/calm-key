/**
 * Estado en memoria del wizard (Sección 12: no se persiste nada en
 * Supabase hasta el paso 6). Un solo useReducer para todos los pasos.
 */
import { useCallback, useMemo, useReducer } from "react";
import type {
  AccountType,
  IncomeSourceType,
  MoneyState,
  PeriodType,
} from "../domain/types";

export const TOTAL_STEPS = 6;

export interface OnboardingState {
  step: number;
  income: {
    name: string;
    source_type: IncomeSourceType;
    expected_amount: string; // string en el form, se parsea al enviar
  };
  allocation: {
    needs_pct: number;
    wants_pct: number;
    construction_pct: number;
  };
  cycle: {
    period_type: PeriodType;
    period_cycle_start_day: string; // 1-31 como string
    custom_start_date: string;
    custom_end_date: string;
  };
  account: {
    name: string;
    type: AccountType;
    currency: string;
    opening_balance: string;
  };
  pocket: {
    skipped: boolean;
    name: string;
    money_state: MoneyState;
    balance: string;
  };
}

type Action =
  | { type: "next" }
  | { type: "back" }
  | { type: "goto"; step: number }
  | { type: "patchIncome"; value: Partial<OnboardingState["income"]> }
  | { type: "patchAllocation"; value: Partial<OnboardingState["allocation"]> }
  | { type: "patchCycle"; value: Partial<OnboardingState["cycle"]> }
  | { type: "patchAccount"; value: Partial<OnboardingState["account"]> }
  | { type: "patchPocket"; value: Partial<OnboardingState["pocket"]> }
  | { type: "skipPocket" };

function initial(defaultCurrency: string): OnboardingState {
  const today = new Date();
  const iso = today.toISOString().slice(0, 10);
  return {
    step: 1,
    income: { name: "Mi salario", source_type: "salary", expected_amount: "" },
    allocation: { needs_pct: 50, wants_pct: 30, construction_pct: 20 },
    cycle: {
      period_type: "monthly",
      period_cycle_start_day: String(today.getDate()),
      custom_start_date: iso,
      custom_end_date: iso,
    },
    account: {
      name: "",
      type: "savings",
      currency: defaultCurrency,
      opening_balance: "0",
    },
    pocket: { skipped: false, name: "", money_state: "available", balance: "0" },
  };
}

function reducer(state: OnboardingState, action: Action): OnboardingState {
  switch (action.type) {
    case "next":
      return { ...state, step: Math.min(TOTAL_STEPS, state.step + 1) };
    case "back":
      return { ...state, step: Math.max(1, state.step - 1) };
    case "goto":
      return { ...state, step: action.step };
    case "patchIncome":
      return { ...state, income: { ...state.income, ...action.value } };
    case "patchAllocation":
      return { ...state, allocation: { ...state.allocation, ...action.value } };
    case "patchCycle":
      return { ...state, cycle: { ...state.cycle, ...action.value } };
    case "patchAccount":
      return { ...state, account: { ...state.account, ...action.value } };
    case "patchPocket":
      return {
        ...state,
        pocket: { ...state.pocket, ...action.value, skipped: false },
      };
    case "skipPocket":
      return {
        ...state,
        pocket: { skipped: true, name: "", money_state: "available", balance: "0" },
        step: Math.min(TOTAL_STEPS, state.step + 1),
      };
    default:
      return state;
  }
}

export function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[^\d.-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

export function useOnboardingWizard(defaultCurrency: string) {
  const [state, dispatch] = useReducer(reducer, defaultCurrency, initial);

  const allocationSum =
    state.allocation.needs_pct +
    state.allocation.wants_pct +
    state.allocation.construction_pct;

  const validators = useMemo(
    () => ({
      1: () => {
        const amt = parseAmount(state.income.expected_amount);
        return state.income.name.trim().length > 0 && !isNaN(amt) && amt > 0;
      },
      2: () => allocationSum === 100,
      3: () => {
        const t = state.cycle.period_type;
        if (t === "custom") {
          return (
            !!state.cycle.custom_start_date &&
            !!state.cycle.custom_end_date &&
            state.cycle.custom_start_date <= state.cycle.custom_end_date
          );
        }
        if (t === "monthly" || t === "biweekly") {
          const d = Number(state.cycle.period_cycle_start_day);
          return Number.isInteger(d) && d >= 1 && d <= 31;
        }
        return true;
      },
      4: () => {
        const bal = parseAmount(state.account.opening_balance);
        return (
          state.account.name.trim().length > 0 &&
          state.account.currency.trim().length > 0 &&
          !isNaN(bal) &&
          bal >= 0
        );
      },
      5: () => {
        if (state.pocket.skipped) return true;
        const bal = parseAmount(state.pocket.balance || "0");
        return state.pocket.name.trim().length > 0 && !isNaN(bal) && bal >= 0;
      },
      6: () => true,
    }),
    [state, allocationSum],
  );

  const canContinue = validators[state.step as 1 | 2 | 3 | 4 | 5 | 6]();

  const next = useCallback(() => dispatch({ type: "next" }), []);
  const back = useCallback(() => dispatch({ type: "back" }), []);

  return {
    state,
    dispatch,
    next,
    back,
    canContinue,
    allocationSum,
  };
}
