import { CheckCircle2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/features/shared/components/Card";
import { Button } from "@/features/shared/components/Button";

export function OnboardingSuccessScreen() {
  return (
    <Card className="flex flex-col items-center gap-5 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
        <CheckCircle2 size={36} aria-hidden />
      </span>
      <div>
        <h1 className="text-2xl font-bold text-foreground">¡Todo listo!</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Tu perfil financiero, tu primera cuenta y tu primer período quedaron
          configurados. Ya puedes empezar a usar Finance OS.
        </p>
      </div>
      <Link to="/bienvenida" className="w-full">
        <Button fullWidth>Ir a mi cuenta</Button>
      </Link>
    </Card>
  );
}
