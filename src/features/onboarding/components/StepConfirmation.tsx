import type { ReactNode } from "react";
import type { OnboardingState } from "../hooks/useOnboardingWizard";
import { parseAmount } from "../hooks/useOnboardingWizard";

const SOURCE_LABEL: Record<string, string> = {
  salary: "Salario",
  freelance: "Trabajo independiente",
  rental: "Arriendo / Renta",
  investment_return: "Retorno de inversión",
  pension: "Pensión",
  other: "Otro",
};
const PERIOD_LABEL: Record<string, string> = {
  monthly: "Mensual",
  biweekly: "Quincenal",
  weekly: "Semanal",
  custom: "Personalizado",
};
const ACCOUNT_LABEL: Record<string, string> = {
  savings: "Cuenta de ahorros",
  checking: "Cuenta corriente",
  digital_wallet: "Billetera digital",
  cash: "Efectivo",
  investment: "Inversión",
  credit: "Crédito",
};
const STATE_LABEL: Record<string, string> = {
  available: "Disponible",
  reserved: "Reservado",
  protected: "Protegido",
  committed: "Comprometido",
};

function money(value: string | number, currency: string) {
  const n = typeof value === "number" ? value : parseAmount(String(value));
  if (!Number.isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString("es-CO")}`;
  }
}

function SummaryCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg bg-muted px-4 py-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <dl className="mt-2 flex flex-col gap-1.5 text-sm">{children}</dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function StepConfirmation({ state }: { state: OnboardingState }) {
  const currency = state.account.currency;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">
          Revisa tu configuración
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Esto es lo que vamos a guardar. Al confirmar, tu cuenta quedará activa.
        </p>
      </div>

      <SummaryCard title="Ingreso principal">
        <Row label="Nombre" value={state.income.name} />
        <Row label="Tipo" value={SOURCE_LABEL[state.income.source_type]} />
        <Row
          label="Monto por período"
          value={money(state.income.expected_amount, currency)}
        />
      </SummaryCard>

      <SummaryCard title="Distribución">
        <Row label="Necesidades" value={`${state.allocation.needs_pct}%`} />
        <Row label="Deseos" value={`${state.allocation.wants_pct}%`} />
        <Row label="Construcción" value={`${state.allocation.construction_pct}%`} />
      </SummaryCard>

      <SummaryCard title="Ciclo financiero">
        <Row label="Tipo" value={PERIOD_LABEL[state.cycle.period_type]} />
        {(state.cycle.period_type === "monthly" ||
          state.cycle.period_type === "biweekly") && (
          <Row
            label="Día de inicio del ciclo"
            value={state.cycle.period_cycle_start_day}
          />
        )}
        {state.cycle.period_type === "custom" && (
          <>
            <Row label="Fecha inicio" value={state.cycle.custom_start_date} />
            <Row label="Fecha fin" value={state.cycle.custom_end_date} />
          </>
        )}
      </SummaryCard>

      <SummaryCard title="Primera cuenta">
        <Row label="Nombre" value={state.account.name} />
        <Row label="Tipo" value={ACCOUNT_LABEL[state.account.type]} />
        <Row label="Moneda" value={state.account.currency} />
        <Row
          label="Saldo inicial"
          value={money(state.account.opening_balance, currency)}
        />
      </SummaryCard>

      <SummaryCard title="Primer bolsillo">
        {state.pocket.skipped ? (
          <p className="text-sm text-muted-foreground">
            Omitido — lo puedes crear más adelante.
          </p>
        ) : (
          <>
            <Row label="Nombre" value={state.pocket.name} />
            <Row
              label="Estado del dinero"
              value={STATE_LABEL[state.pocket.money_state]}
            />
            <Row
              label="Saldo inicial"
              value={money(state.pocket.balance, currency)}
            />
          </>
        )}
      </SummaryCard>
    </div>
  );
}
