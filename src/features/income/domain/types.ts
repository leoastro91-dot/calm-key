/**
 * Dominio del feature Ingresos (LOVABLE-004).
 * Reutiliza tipos ya existentes de onboarding y agrega los propios del período.
 */
import type {
  IncomeSource,
  IncomeSourceType,
  PeriodType,
} from "@/features/onboarding/domain/types";

export type { IncomeSource, IncomeSourceType, PeriodType };

/** Snapshot del período activo, incluye lo necesario para el header + validaciones. */
export interface ActivePeriod {
  id: string;
  user_id: string;
  workspace_id: string;
  period_type: PeriodType;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  status: "active" | "closed" | "archived";
  expected_income: number;
  total_income_received: number;
}

export interface PeriodIncome {
  id: string;
  user_id: string;
  workspace_id: string;
  financial_period_id: string;
  income_source_id: string;
  transaction_id: string;
  amount_received: number;
  received_date: string;
  variance_amount: number;
  notes: string | null;
}

export interface PeriodIncomeWithSource extends PeriodIncome {
  income_source: Pick<IncomeSource, "id" | "name" | "source_type"> | null;
}

export const INCOME_SOURCE_TYPE_LABELS: Record<IncomeSourceType, string> = {
  salary: "Salario",
  freelance: "Trabajo independiente",
  rental: "Arriendo / Renta",
  investment_return: "Retorno de inversión",
  pension: "Pensión",
  other: "Otro",
};

export const OTHER_INCOME_TYPE_OPTIONS: Array<{
  value: IncomeSourceType;
  label: string;
}> = [
  { value: "freelance", label: "Trabajo independiente" },
  { value: "rental", label: "Arriendo / Renta" },
  { value: "investment_return", label: "Retorno de inversión" },
  { value: "pension", label: "Pensión" },
  { value: "other", label: "Otro" },
];

const MONTHS_ES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

/** Formatea "2026-07-25" → "25 jul 2026". Tolera zonas horarias usando split. */
export function formatDateEs(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS_ES[m - 1]} ${y}`;
}

/** Rango legible: "25 jul – 24 ago 2026". */
export function formatPeriodRange(start: string, end: string): string {
  const [ys, ms, ds] = start.split("-").map(Number);
  const [ye, me, de] = end.split("-").map(Number);
  if (!ys || !me) return `${start} – ${end}`;
  const startLabel =
    ys === ye
      ? `${ds} ${MONTHS_ES[ms - 1]}`
      : `${ds} ${MONTHS_ES[ms - 1]} ${ys}`;
  return `${startLabel} – ${de} ${MONTHS_ES[me - 1]} ${ye}`;
}

/** Compara YYYY-MM-DD lexicográficamente (válido para fechas ISO). */
export function isDateInRange(
  date: string,
  start: string,
  end: string,
): boolean {
  return date >= start && date <= end;
}
