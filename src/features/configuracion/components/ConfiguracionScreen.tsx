import { useState } from "react";
import { Card } from "@/features/shared/components/Card";
import { Alert } from "@/features/shared/components/Alert";
import { Spinner } from "@/features/shared/components/Spinner";
import { useFinancialProfile } from "../hooks/useDistribution";
import { DistributionSummaryCard } from "./DistributionSummaryCard";
import { EditDistributionForm } from "./EditDistributionForm";

export function ConfiguracionScreen() {
  const { data: profile, isLoading, isError } = useFinancialProfile();
  const [editing, setEditing] = useState(false);

  if (isLoading) {
    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">
          Cargando tu configuración…
        </p>
      </Card>
    );
  }

  if (isError || !profile) {
    return (
      <Alert variant="error">
        No pudimos cargar tu perfil financiero. Completa el onboarding primero.
      </Alert>
    );
  }

  if (editing) {
    return (
      <EditDistributionForm
        profileId={profile.id}
        initial={{
          needs_pct: Number(profile.needs_pct),
          wants_pct: Number(profile.wants_pct),
          construction_pct: Number(profile.construction_pct),
        }}
        onDone={() => setEditing(false)}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <DistributionSummaryCard
      needs_pct={Number(profile.needs_pct)}
      wants_pct={Number(profile.wants_pct)}
      construction_pct={Number(profile.construction_pct)}
      onEdit={() => setEditing(true)}
    />
  );
}
