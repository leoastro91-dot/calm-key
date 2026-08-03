import { useMemo, useState } from "react";
import { Input } from "@/features/shared/components/Input";
import { Button } from "@/features/shared/components/Button";
import { Alert } from "@/features/shared/components/Alert";
import { OnboardingSelect } from "@/features/onboarding/components/OnboardingSelect";
import { useToast } from "@/features/shared/components/Toast";
import { toISODate } from "@/features/onboarding/domain/types";
import {
  formatMoney,
  parseMoneyInput,
} from "@/features/accounts/domain/types";
import type { Account, Pocket } from "@/features/accounts/domain/types";
import type { Category } from "@/features/budget/domain/types";
import type { ActivePeriod } from "@/features/income/domain/types";
import {
  formatPeriodRange,
  isDateInRange,
} from "@/features/income/domain/types";
import { CategoryPickerByBlock } from "@/features/budget/components/CategoryPickerByBlock";
import { PocketSelector } from "@/features/movements/components/PocketSelector";
import { ProtectedPocketWarning } from "@/features/movements/components/ProtectedPocketWarning";
import { SpendingNatureSelector } from "./SpendingNatureSelector";
import { FundingSourceSelector } from "./FundingSourceSelector";
import { useRegisterExpense } from "../hooks/useRegisterExpense";
import type {
  ExpenseFundingSource,
  SpendingNature,
  Subcategory,
} from "../domain/types";

interface Props {
  accounts: Account[];
  pockets: Pocket[];
  categories: Category[];
  subcategories: Subcategory[];
  period: ActivePeriod | null;
  onDone: () => void;
  onCancel: () => void;
}

export function ExpenseForm({
  accounts,
  pockets,
  categories,
  subcategories,
  period,
  onDone,
  onCancel,
}: Props) {
  const activeAccounts = accounts.filter((a) => a.is_active);
  const activePockets = pockets.filter((p) => p.is_active);

  const firstAcct = activeAccounts[0];
  const firstPockets = activePockets.filter(
    (p) => p.account_id === firstAcct?.id,
  );

  const [accountId, setAccountId] = useState(firstAcct?.id ?? "");
  const [pocketId, setPocketId] = useState(firstPockets[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(toISODate(new Date()));
  const [nature, setNature] = useState<SpendingNature>("normal");
  const [description, setDescription] = useState("");
  const [eventTag, setEventTag] = useState("");
  const [error, setError] = useState<string | null>(null);

  const register = useRegisterExpense();
  const { toast } = useToast();

  const pocket = useMemo(
    () => activePockets.find((p) => p.id === pocketId) ?? null,
    [activePockets, pocketId],
  );
  const account = useMemo(
    () => activeAccounts.find((a) => a.id === accountId) ?? null,
    [activeAccounts, accountId],
  );
  const available = pocket ? Number(pocket.balance) : 0;
  const isProtected = pocket?.money_state === "protected";
  const currency = account?.currency ?? "COP";

  const subOptions = useMemo(() => {
    if (!categoryId) return [];
    return subcategories.filter((s) => s.category_id === categoryId);
  }, [subcategories, categoryId]);

  const onChangeAccount = (id: string) => {
    setAccountId(id);
    const list = activePockets.filter((p) => p.account_id === id);
    setPocketId(list[0]?.id ?? "");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = parseMoneyInput(amount);
    if (parsed === null || parsed <= 0) {
      return setError("Ingresa un monto mayor a cero.");
    }
    if (!accountId || !pocketId) {
      return setError("Elige la cuenta y el bolsillo desde donde sale el gasto.");
    }
    if (!categoryId) {
      return setError("Elige una categoría para clasificar el gasto.");
    }
    if (parsed > available) {
      return setError(
        `El monto supera lo disponible en ${pocket?.name} (${formatMoney(available, currency)}).`,
      );
    }
    if (period && !isDateInRange(date, period.start_date, period.end_date)) {
      return setError(
        `La fecha debe estar dentro del período activo (${formatPeriodRange(period.start_date, period.end_date)}).`,
      );
    }

    try {
      const result = await register.mutateAsync({
        amount: parsed,
        date,
        description: description.trim() || null,
        event_tag: eventTag.trim() || null,
        account_id: accountId,
        pocket_id: pocketId,
        category_id: categoryId,
        subcategory_id: subcategoryId || null,
        spending_nature: nature,
      });
      toast(
        result.linkedToBudget
          ? "Gasto registrado y vinculado a tu presupuesto."
          : "Gasto registrado. No hay línea de presupuesto para esa categoría.",
        "success",
      );
      onDone();
    } catch (err) {
      console.error(err);
      setError("No pudimos registrar el gasto. Intenta de nuevo.");
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">
          Registrar gasto
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Descuenta del bolsillo elegido y, si tienes esa categoría en tu
          presupuesto, actualiza su ejecución.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <PocketSelector
        label="Desde"
        accounts={activeAccounts}
        pockets={activePockets}
        accountId={accountId}
        pocketId={pocketId}
        onChangeAccount={onChangeAccount}
        onChangePocket={setPocketId}
        currency={currency}
      />

      {pocket && (
        <p className="text-xs text-muted-foreground">
          Disponible en <strong>{pocket.name}</strong>:{" "}
          <span className="tabular-nums font-semibold text-foreground">
            {formatMoney(available, currency)}
          </span>
        </p>
      )}

      {isProtected && pocket && (
        <ProtectedPocketWarning pocketName={pocket.name} />
      )}

      <CategoryPickerByBlock
        id="expense-category"
        categories={categories}
        excludeCategoryIds={[]}
        value={categoryId}
        onChange={(id) => {
          setCategoryId(id);
          setSubcategoryId("");
        }}
      />

      {subOptions.length > 0 && (
        <OnboardingSelect
          label="Subcategoría (opcional)"
          value={subcategoryId}
          onChange={(e) => setSubcategoryId(e.target.value)}
          options={[
            { value: "", label: "Sin subcategoría" },
            ...subOptions.map((s) => ({ value: s.id, label: s.name })),
          ]}
        />
      )}

      <Input
        label="Monto"
        inputMode="decimal"
        placeholder="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <Input
        label="Fecha"
        type="date"
        value={date}
        min={period?.start_date}
        max={period?.end_date}
        onChange={(e) => setDate(e.target.value)}
      />

      <SpendingNatureSelector value={nature} onChange={setNature} />

      <Input
        label="Descripción (opcional)"
        placeholder="Ej. Mercado del sábado"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={200}
      />

      <Input
        label="Etiqueta de evento (opcional)"
        placeholder="Ej. Mateo, Viaje Cartagena"
        value={eventTag}
        onChange={(e) => setEventTag(e.target.value)}
        maxLength={80}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={register.isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={register.isPending}>
          Registrar gasto
        </Button>
      </div>
    </form>
  );
}
