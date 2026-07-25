import { Card } from "@/features/shared/components/Card";
import {
  BLOCK_LABELS,
  BLOCK_ORDER,
  type BudgetItemWithCategory,
} from "../domain/types";
import { BudgetItemCard } from "./BudgetItemCard";

interface Props {
  items: BudgetItemWithCategory[];
  currency: string;
}

export function BudgetItemList({ items, currency }: Props) {
  if (!items.length) {
    return (
      <Card className="flex flex-col items-center gap-1.5 py-8 text-center">
        <p className="text-base font-semibold text-foreground">
          Aún no tienes categorías en tu presupuesto
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Agrega la primera categoría para empezar a planear cuánto proyectas
          gastar este período.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {BLOCK_ORDER.map((block) => {
        const group = items.filter((i) => i.category?.block_5030 === block);
        if (!group.length) return null;
        return (
          <section key={block} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-muted-foreground">
              {BLOCK_LABELS[block]}
            </h3>
            <ul className="flex flex-col gap-2">
              {group.map((item) => (
                <BudgetItemCard
                  key={item.id}
                  item={item}
                  currency={currency}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
