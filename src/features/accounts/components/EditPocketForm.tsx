import { useState } from "react";
import { Input } from "@/features/shared/components/Input";
import { Button } from "@/features/shared/components/Button";
import { Alert } from "@/features/shared/components/Alert";
import { OnboardingSelect } from "@/features/onboarding/components/OnboardingSelect";
import { useToast } from "@/features/shared/components/Toast";
import { useUpdatePocket } from "../hooks/useAccountMutations";
import {
  MONEY_STATE_DESCRIPTIONS,
  MONEY_STATE_LABELS,
  type MoneyState,
  type Pocket,
} from "../domain/types";

const STATES = (
  ["available", "reserved", "protected", "committed"] as MoneyState[]
).map((v) => ({
  value: v,
  label: `${MONEY_STATE_LABELS[v]} — ${MONEY_STATE_DESCRIPTIONS[v]}`,
}));

export function EditPocketForm({
  pocket,
  isGeneral,
  onDone,
  onCancel,
}: {
  pocket: Pocket;
  isGeneral: boolean;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(pocket.name);
  const [state, setState] = useState<MoneyState>(pocket.money_state);
  const [error, setError] = useState<string | null>(null);
  const update = useUpdatePocket();
  const { toast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("El nombre no puede estar vacío.");
    if (!isGeneral && name.trim().toLowerCase() === "general")
      return setError('El nombre "General" está reservado.');
    try {
      await update.mutateAsync({
        id: pocket.id,
        name: isGeneral ? pocket.name : name.trim(),
        money_state: isGeneral ? "available" : state,
      });
      toast("Bolsillo actualizado.", "success");
      onDone();
    } catch (err) {
      console.error(err);
      setError("No pudimos guardar los cambios.");
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <h4 className="text-base font-semibold text-foreground">
        Editar bolsillo
      </h4>
      {isGeneral && (
        <Alert variant="info">
          El bolsillo <strong>General</strong> es el punto de partida del dinero
          de la cuenta — su nombre y estado no se pueden cambiar.
        </Alert>
      )}
      {error && <Alert variant="error">{error}</Alert>}
      <Input
        label="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={isGeneral}
      />
      <OnboardingSelect
        label="Estado del dinero"
        options={STATES}
        value={state}
        onChange={(e) => setState(e.target.value as MoneyState)}
        disabled={isGeneral}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={update.isPending}
          disabled={isGeneral}
          className="flex-1"
        >
          Guardar
        </Button>
      </div>
    </form>
  );
}
