import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/features/shared/components/Button";
import { Input } from "@/features/shared/components/Input";
import { Alert } from "@/features/shared/components/Alert";
import { authService, mapAuthError } from "../services/authService";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RequestPasswordResetForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError("Ingresa un correo válido.");
      return;
    }
    setLoading(true);
    try {
      await authService.requestPasswordReset(email.trim());
      // Por seguridad, no revelamos si el email existe o no (CP-08).
      setSent(true);
    } catch (err) {
      const msg = mapAuthError(err);
      // Errores genéricos también terminan en confirmación neutra,
      // salvo problemas de red/configuración.
      if (msg.includes("conectar") || msg.includes("backend")) setError(msg);
      else setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="success">
          Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu
          contraseña en unos minutos.
        </Alert>
        <Link to="/login" className="text-center text-sm font-medium text-primary hover:underline">
          Volver a inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      {error && <Alert variant="error">{error}</Alert>}
      <Input
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        helperText="Te enviaremos un enlace para restablecer tu contraseña."
        disabled={loading}
        required
      />
      <Button type="submit" loading={loading} fullWidth>
        Enviar enlace de recuperación
      </Button>
      <Link to="/login" className="text-center text-sm font-medium text-primary hover:underline">
        Volver a inicio de sesión
      </Link>
    </form>
  );
}
