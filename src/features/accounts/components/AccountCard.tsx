import { useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, Archive } from "lucide-react";
import { Card } from "@/features/shared/components/Card";
import { Button } from "@/features/shared/components/Button";
import { Alert } from "@/features/shared/components/Alert";
import { useToast } from "@/features/shared/components/Toast";
import { PocketRow } from "./PocketRow";
import { CreatePocketForm } from "./CreatePocketForm";
import { EditAccountForm } from "./EditAccountForm";
import { useDeactivateAccount } from "../hooks/useAccountMutations";
import {
  ACCOUNT_TYPE_LABELS,
  GENERAL_POCKET_NAME,
  formatMoney,
} from "../domain/types";
import type { AccountWithPockets } from "../hooks/useAccountsData";

interface Props {
  data: AccountWithPockets;
}

export function AccountCard({ data }: Props) {
  const { account, activePockets, pocketsTotal } = data;
  const [expanded, setExpanded] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const deactivate = useDeactivateAccount();
  const { toast } = useToast();

  const general = activePockets.find((p) => p.name === GENERAL_POCKET_NAME);
  const availableInGeneral = general ? Number(general.balance) : 0;
  const invariantOk =
    Math.abs(Number(account.current_balance) - pocketsTotal) < 0.005;

  const onDeactivate = async () => {
    if (!account.is_active) return;
    if (Number(account.current_balance) > 0) {
      toast(
        "No puedes archivar una cuenta con saldo. Muévelo primero.",
        "error",
      );
      return;
    }
    if (
      !window.confirm(
        `¿Archivar la cuenta "${account.name}"? Podrás volver a activarla después.`,
      )
    ) {
      return;
    }
    try {
      await deactivate.mutateAsync(account.id);
      toast("Cuenta archivada.", "success");
    } catch {
      toast("No pudimos archivar la cuenta.", "error");
    }
  };

  if (editing) {
    return (
      <Card>
        <EditAccountForm
          account={account}
          onDone={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4 p-5 sm:p-6">
      <header className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex flex-1 items-start gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          aria-expanded={expanded}
        >
          <span className="mt-0.5 text-muted-foreground">
            {expanded ? (
              <ChevronUp size={18} aria-hidden />
            ) : (
              <ChevronDown size={18} aria-hidden />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-lg font-semibold text-foreground">
                {account.name}
              </h3>
              {!account.is_active && (
                <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  Archivada
                </span>
              )}
              {!account.include_in_total && (
                <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  Fuera del total
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {ACCOUNT_TYPE_LABELS[account.type]} · {account.currency}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-foreground tabular-numbers">
              {formatMoney(Number(account.current_balance), account.currency)}
            </p>
            <p className="text-xs text-muted-foreground">
              {activePockets.length} bolsillo{activePockets.length === 1 ? "" : "s"}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={`Editar ${account.name}`}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Pencil size={16} aria-hidden />
          </button>
          {account.is_active && (
            <button
              type="button"
              onClick={onDeactivate}
              aria-label={`Archivar ${account.name}`}
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Archive size={16} aria-hidden />
            </button>
          )}
        </div>
      </header>

      {expanded && (
        <div className="flex flex-col gap-3">
          {!invariantOk && (
            <Alert variant="warning">
              El saldo de la cuenta y la suma de los bolsillos no coinciden.
              Revisa los movimientos.
            </Alert>
          )}
          <div className="flex flex-col gap-2">
            {activePockets.map((p) => (
              <PocketRow key={p.id} pocket={p} currency={account.currency} />
            ))}
          </div>
          {creating ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4">
              <CreatePocketForm
                accountId={account.id}
                currency={account.currency}
                availableInGeneral={availableInGeneral}
                onDone={() => setCreating(false)}
                onCancel={() => setCreating(false)}
              />
            </div>
          ) : (
            account.is_active && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreating(true)}
                className="w-full justify-center"
              >
                <Plus size={16} aria-hidden /> Agregar bolsillo
              </Button>
            )
          )}
        </div>
      )}
    </Card>
  );
}
