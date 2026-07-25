import { Inbox } from "lucide-react";
import { Card } from "@/features/shared/components/Card";
import type { Account, Pocket } from "@/features/accounts/domain/types";
import type { Debt } from "../domain/types";
import { DebtCard } from "./DebtCard";

interface Props {
  title: string;
  debts: Debt[];
  accounts: Account[];
  pockets: Pocket[];
  emptyText?: string;
}

export function DebtList({ title, debts, accounts, pockets, emptyText }: Props) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {debts.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-8 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Inbox size={22} aria-hidden />
          </span>
          <p className="text-sm text-muted-foreground">
            {emptyText ?? "No hay deudas para mostrar."}
          </p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {debts.map((d) => (
            <li key={d.id}>
              <DebtCard debt={d} accounts={accounts} pockets={pockets} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
