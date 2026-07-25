import { Card } from "@/features/shared/components/Card";
import { formatMoney } from "@/features/accounts/domain/types";

interface Props {
  amount: number;
  currency: string;
}

export function PatrimonySummary({ amount, currency }: Props) {
  return (
    <Card className="flex flex-col gap-2 p-6 sm:p-8">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">
        Patrimonio total
      </p>
      <p className="text-4xl font-bold text-foreground tabular-numbers sm:text-5xl">
        {formatMoney(amount, currency)}
      </p>
      <p className="text-xs text-muted-foreground">
        Suma de las cuentas activas incluidas en el total.
      </p>
    </Card>
  );
}
