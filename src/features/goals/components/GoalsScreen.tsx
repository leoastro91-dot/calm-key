import { useState } from "react";
import { Plus, Target } from "lucide-react";
import { Card } from "@/features/shared/components/Card";
import { Alert } from "@/features/shared/components/Alert";
import { Button } from "@/features/shared/components/Button";
import { Spinner } from "@/features/shared/components/Spinner";
import { useToast } from "@/features/shared/components/Toast";
import type { Pocket } from "@/features/accounts/domain/types";
import { useGoalPockets } from "../hooks/useGoalPockets";
import { useConfigureGoal } from "../hooks/useConfigureGoal";
import { GoalPocketCard } from "./GoalPocketCard";
import { ConfigureGoalForm } from "./ConfigureGoalForm";

type FormMode =
  | { kind: "closed" }
  | { kind: "new" }
  | { kind: "edit"; pocket: Pocket };

export function GoalsScreen() {
  const {
    goals,
    pocketsWithoutGoal,
    activePockets,
    accountsById,
    currency,
    isLoading,
    isError,
  } = useGoalPockets();
  const [mode, setMode] = useState<FormMode>({ kind: "closed" });
  const remove = useConfigureGoal();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <Card className="flex justify-center py-10">
        <Spinner size="lg" />
      </Card>
    );
  }
  if (isError) {
    return (
      <Alert variant="error">No pudimos cargar tus metas por bolsillo.</Alert>
    );
  }

  const handleRemove = async (pocket: Pocket) => {
    try {
      await remove.mutateAsync({
        pocket_id: pocket.id,
        target_amount: null,
      });
      toast("Meta eliminada.", "success");
    } catch (err) {
      console.error(err);
      toast("No pudimos quitar la meta.", "error");
    }
  };

  const formPockets =
    mode.kind === "edit" ? [mode.pocket] : pocketsWithoutGoal;

  return (
    <div className="flex flex-col gap-5">
      {mode.kind === "closed" && (
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => setMode({ kind: "new" })}
            disabled={activePockets.length === 0}
          >
            <Plus size={16} aria-hidden />
            Configurar meta
          </Button>
        </div>
      )}

      {mode.kind !== "closed" && (
        <Card className="p-4">
          <ConfigureGoalForm
            pockets={formPockets}
            accountsById={accountsById}
            currency={currency}
            initialPocket={mode.kind === "edit" ? mode.pocket : null}
            onDone={() => setMode({ kind: "closed" })}
            onCancel={() => setMode({ kind: "closed" })}
          />
        </Card>
      )}

      {goals.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Target size={22} aria-hidden />
          </span>
          <p className="text-sm text-muted-foreground">
            Aún no tienes metas configuradas. Elige un bolsillo (por ejemplo{" "}
            <em>Vacaciones</em> o <em>Fondo de emergencia</em>) y ponle un monto
            objetivo — el dinero que ya está adentro cuenta desde ya.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {goals.map((g) => (
            <GoalPocketCard
              key={g.pocket.id}
              goal={g}
              currency={currency}
              onEdit={() => setMode({ kind: "edit", pocket: g.pocket })}
              onRemove={() => handleRemove(g.pocket)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
