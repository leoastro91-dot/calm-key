import { ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/features/shared/components/Card";
import { Alert } from "@/features/shared/components/Alert";
import { Badge } from "@/features/shared/components/Badge";
import { Button } from "@/features/shared/components/Button";
import { Spinner } from "@/features/shared/components/Spinner";
import { useAuth } from "../hooks/useAuth";
import { useWorkspace } from "../hooks/useWorkspace";
import { LogoutButton } from "./LogoutButton";

function WelcomeSkeleton() {
  return (
    <Card className="flex flex-col items-center gap-4 py-10 text-center">
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">Estamos configurando tu cuenta…</p>
    </Card>
  );
}

export function WelcomeCard() {
  const { user } = useAuth();
  const { profile, workspace, isLoading, isError, retry } = useWorkspace();

  if (isLoading) return <WelcomeSkeleton />;

  if (isError || !profile || !workspace) {
    return (
      <Card className="flex flex-col gap-4">
        <Alert variant="error">
          No pudimos terminar de configurar tu cuenta. Tu sesión está activa, pero falta
          crear tu perfil o tu espacio de trabajo.
        </Alert>
        <Button onClick={() => retry()} fullWidth>
          Reintentar
        </Button>
        <div className="flex justify-center">
          <LogoutButton />
        </div>
      </Card>
    );
  }

  const displayName =
    profile.full_name?.trim() ||
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email ||
    "";

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
          <ShieldCheck size={28} aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-bold leading-8 text-foreground">
            ¡Bienvenido, {displayName}!
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tu cuenta está lista y tu información es privada y segura.
          </p>
        </div>
      </div>

      <dl className="flex flex-col gap-3 rounded-lg bg-muted px-4 py-4 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Correo</dt>
          <dd className="font-medium text-foreground">{user?.email}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Workspace</dt>
          <dd className="font-medium text-foreground">{workspace.name}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Estado de cuenta</dt>
          <dd>
            <Badge status={profile.account_status} />
          </dd>
        </div>
      </dl>

      <div className="flex flex-col gap-3">
        {profile.account_status === "onboarding" ? (
          <Link to="/onboarding" className="w-full">
            <Button fullWidth>Configurar mi perfil financiero</Button>
          </Link>
        ) : (
          <Alert variant="success">
            Tu perfil financiero ya está configurado.
          </Alert>
        )}
        <div className="flex justify-center">
          <LogoutButton />
        </div>
      </div>
    </Card>
  );
}
