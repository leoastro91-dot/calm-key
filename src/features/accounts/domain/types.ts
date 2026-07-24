/**
 * Dominio del feature Cuentas & Bolsillos (LOVABLE-003).
 * Reutiliza los tipos de onboarding para mantener una sola fuente de verdad.
 */
export type {
  Account,
  AccountType,
  Pocket,
  MoneyState,
} from "@/features/onboarding/domain/types";

import type { AccountType, MoneyState } from "@/features/onboarding/domain/types";

export const GENERAL_POCKET_NAME = "General";

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  savings: "Cuenta de ahorros",
  checking: "Cuenta corriente",
  digital_wallet: "Billetera digital",
  cash: "Efectivo",
  investment: "Inversión",
  credit: "Crédito",
};

export const MONEY_STATE_LABELS: Record<MoneyState, string> = {
  available: "Disponible",
  reserved: "Reservado",
  protected: "Protegido",
  committed: "Comprometido",
};

export const MONEY_STATE_DESCRIPTIONS: Record<MoneyState, string> = {
  available: "Puedo gastarlo hoy",
  reserved: "Reservado para un plan cercano",
  protected: "Protegido — no lo toco",
  committed: "Ya tiene un destino asignado",
};

/** Colores tokenizados para el badge y la barra resumen (semánticos). */
export const MONEY_STATE_TONE: Record<
  MoneyState,
  { badge: string; dot: string }
> = {
  available: {
    badge: "bg-success/15 text-success border-success/30",
    dot: "bg-success",
  },
  reserved: {
    badge: "bg-warning/15 text-warning border-warning/30",
    dot: "bg-warning",
  },
  protected: {
    badge: "bg-primary/15 text-primary border-primary/30",
    dot: "bg-primary",
  },
  committed: {
    badge: "bg-secondary/25 text-secondary-foreground border-secondary/40",
    dot: "bg-secondary",
  },
};

/** Formateo monetario según la moneda de la cuenta (fallback a es-CO). */
export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/** Parser tolerante: acepta "1.234,56" y "1234.56". Devuelve null si inválido. */
export function parseMoneyInput(raw: string): number | null {
  if (!raw) return null;
  const normalized = raw.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}
