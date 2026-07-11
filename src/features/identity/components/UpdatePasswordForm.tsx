import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/features/shared/components/Button";
import { Input } from "@/features/shared/components/Input";
import { Alert } from "@/features/shared/components/Alert";
import { authService, mapAuthError } from "../services/authService";
import { useAuth } from "../hooks/useAuth";
import { FullScreenLoader } from "./AuthLayout";

export function UpdatePasswordForm() {
  const navigate = useNavigate();
  const { session, isLoading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isLoading) return <FullScreenLoader />;

  // El enlace de recuperación crea una sesión temporal. Sin ella, el token
  // es inválido o expiró.
  if (!session && !done) {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="error">
          El enlace de recuperación no es válido o ya expiró. Solicita uno nuevo.
        </Alert>
        <Link
          to="/recuperar-password"
          className="text-center text-sm font-medium text-primary hover:underline"
        >
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (confirm !== password) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      await authService.updatePassword(password);
      setDone(true);
      await authService.signOut();
      setTimeout(() => navigate({ to: "/login" }), 1800);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Alert variant="success">
        Tu contraseña fue actualizada. Te llevamos a inicio de sesión…
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      {error && <Alert variant="error">{error}</Alert>}
      <Input
        label="Nueva contraseña"
        revealable
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        helperText="Mínimo 8 caracteres."
        disabled={loading}
        required
      />
      <Input
        label="Confirmar nueva contraseña"
        revealable
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        disabled={loading}
        required
      />
      <Button type="submit" loading={loading} fullWidth>
        Guardar nueva contraseña
      </Button>
    </form>
  );
}
