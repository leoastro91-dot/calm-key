import { Link } from "@tanstack/react-router";
import { Alert } from "@/features/shared/components/Alert";
import { Card } from "@/features/shared/components/Card";
import { Spinner } from "@/features/shared/components/Spinner";
import { useDashboardData } from "../hooks/useDashboardData";
import { useGoalPockets } from "@/features/goals/hooks/useGoalPockets";
import { PatrimonySummary } from "./PatrimonySummary";
import { MoneyStateGrid } from "./MoneyStateGrid";
import { ActivePeriodProgress } from "./ActivePeriodProgress";
import { BudgetBlocksSummary } from "./BudgetBlocksSummary";
import { RealDistributionComparison } from "./RealDistributionComparison";
import { RecentExpensesList } from "./RecentExpensesList";
import { DebtsSummaryCard } from "./DebtsSummaryCard";
import { GoalsSummarySection } from "./GoalsSummarySection";

function SectionEmpty({ children }: { children: React.ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-1 py-6 text-center">
      <p className="text-sm text-muted-foreground">{children}</p>
    </Card>
  );
}

function SectionError({ children }: { children: React.ReactNode }) {
  return <Alert variant="error">{children}</Alert>;
}

function SectionHeading({
  title,
  href,
  cta,
}: {
  title: string;
  href?: "/cuentas" | "/presupuesto" | "/ingresos" | "/gastos" | "/deudas" | "/metas";
  cta?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {href && cta && (
        <Link
          to={href}
          className="text-xs font-medium text-primary hover:underline"
        >
          {cta}
        </Link>
      )}
    </div>
  );
}

export function DashboardScreen() {
  const d = useDashboardData();
  const goalsQ = useGoalPockets();



  return (
    <div className="flex flex-col gap-6">
      {/* Patrimonio + estados */}
      <section className="flex flex-col gap-3">
        {d.status.accounts.loading ? (
          <Card className="flex justify-center py-10">
            <Spinner size="lg" />
          </Card>
        ) : d.status.accounts.error ? (
          <SectionError>
            No pudimos cargar tus cuentas y bolsillos.
          </SectionError>
        ) : (
          <>
            <PatrimonySummary amount={d.patrimony} currency={d.currency} />
            <SectionHeading title="Estados del dinero" href="/cuentas" cta="Ver cuentas →" />
            <MoneyStateGrid totals={d.moneyStateTotals} currency={d.currency} />
          </>
        )}
      </section>

      {/* Período activo */}
      <section className="flex flex-col gap-3">
        <SectionHeading title="Período activo" href="/ingresos" cta="Ver ingresos →" />
        {d.status.period.loading ? (
          <Card className="flex justify-center py-6">
            <Spinner />
          </Card>
        ) : d.status.period.error ? (
          <SectionError>No pudimos cargar el período activo.</SectionError>
        ) : d.period ? (
          <ActivePeriodProgress
            period={d.period}
            daysRemaining={d.periodDaysRemaining}
            currency={d.currency}
          />
        ) : (
          <SectionEmpty>
            No tienes un período financiero activo todavía.
          </SectionEmpty>
        )}
      </section>

      {/* Presupuesto por bloque */}
      <section className="flex flex-col gap-3">
        <SectionHeading title="Presupuesto del período" href="/presupuesto" cta="Ver presupuesto →" />
        {d.status.budget.loading ? (
          <Card className="flex justify-center py-6">
            <Spinner />
          </Card>
        ) : d.status.budget.error ? (
          <SectionError>No pudimos cargar el presupuesto.</SectionError>
        ) : !d.profile ? (
          <SectionEmpty>
            Falta tu perfil financiero para calcular las metas por bloque.
          </SectionEmpty>
        ) : !d.period ? (
          <SectionEmpty>
            Necesitas un período activo para ver tu presupuesto.
          </SectionEmpty>
        ) : (
          <BudgetBlocksSummary
            blocks={d.blocks}
            profile={d.profile}
            currency={d.currency}
          />
        )}
      </section>

      {/* Distribución real vs objetivo */}
      <section className="flex flex-col gap-3">
        <SectionHeading
          title="Distribución real vs. objetivo"
          href="/presupuesto"
          cta="Ver todo →"
        />
        {d.status.budget.loading || d.status.profile.loading ? (
          <Card className="flex justify-center py-6">
            <Spinner />
          </Card>
        ) : d.status.budget.error || d.status.profile.error ? (
          <SectionError>
            No pudimos calcular la distribución real.
          </SectionError>
        ) : !d.profile ? (
          <SectionEmpty>
            Configura tu distribución 50/30/20 para comparar tu ejecución real.
          </SectionEmpty>
        ) : (
          <RealDistributionComparison
            blocks={d.blocks}
            totalActual={d.totalActual}
            profile={d.profile}
            currency={d.currency}
          />
        )}
      </section>

      {/* Gastos recientes */}
      <section>
        {d.status.expenses.loading ? (
          <Card className="flex justify-center py-6">
            <Spinner />
          </Card>
        ) : d.status.expenses.error ? (
          <SectionError>No pudimos cargar tus gastos.</SectionError>
        ) : (
          <RecentExpensesList
            expenses={d.recentExpenses}
            currency={d.currency}
          />
        )}
      </section>

      {/* Metas por bolsillo */}
      <section>
        {goalsQ.isLoading ? (
          <Card className="flex justify-center py-6">
            <Spinner />
          </Card>
        ) : goalsQ.isError ? (
          <SectionError>No pudimos cargar tus metas.</SectionError>
        ) : (
          <GoalsSummarySection goals={goalsQ.goals} currency={goalsQ.currency} />
        )}
      </section>

      {/* Deudas */}
      <section>
        {d.status.debts.loading ? (
          <Card className="flex justify-center py-6">
            <Spinner />
          </Card>
        ) : d.status.debts.error ? (
          <SectionError>No pudimos cargar tus deudas.</SectionError>
        ) : (
          <DebtsSummaryCard summary={d.debtsSummary} currency={d.currency} />
        )}
      </section>
    </div>
  );
}
