import { useState } from "react";
import { Pencil, Archive } from "lucide-react";
import { useToast } from "@/features/shared/components/Toast";
import { MoneyStateBadge } from "./MoneyStateBadge";
import { EditPocketForm } from "./EditPocketForm";
import { useDeactivatePocket } from "../hooks/useAccountMutations";
import { formatMoney, GENERAL_POCKET_NAME, type Pocket } from "../domain/types";

interface Props {
  pocket: Pocket;
  currency: string;
}

export function PocketRow({ pocket, currency }: Props) {
  const [editing, setEditing] = useState(false);
  const isGeneral = pocket.name === GENERAL_POCKET_NAME;
  const deactivate = useDeactivatePocket();
  const { toast } = useToast();

  const onDeactivate = async () => {
    if (Number(pocket.balance) > 0) {
      toast(
        "No puedes archivar un bolsillo con saldo. Muévelo primero.",
        "error",
      );
      return;
    }
    if (
      !window.confirm(
        `¿Archivar el bolsillo "${pocket.name}"? Podrás volver a crearlo después.`,
      )
    ) {
      return;
    }
    try {
      await deactivate.mutateAsync({
        id: pocket.id,
        balance: Number(pocket.balance),
        isGeneral,
      });
      toast("Bolsillo archivado.", "success");
    } catch {
      toast("No pudimos archivar el bolsillo.", "error");
    }
  };

  if (editing) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <EditPocketForm
          pocket={pocket}
          isGeneral={isGeneral}
          onDone={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">
            {pocket.name}
            {isGeneral && (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                (auto)
              </span>
            )}
          </p>
          <MoneyStateBadge state={pocket.money_state} />
        </div>
        <p className="mt-0.5 text-sm font-semibold text-foreground tabular-numbers">
          {formatMoney(Number(pocket.balance), currency)}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={`Editar ${pocket.name}`}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Pencil size={16} aria-hidden />
        </button>
        {!isGeneral && (
          <button
            type="button"
            onClick={onDeactivate}
            aria-label={`Archivar ${pocket.name}`}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Archive size={16} aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
