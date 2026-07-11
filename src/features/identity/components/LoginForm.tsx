import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/features/shared/components/Button";
import { Input } from "@/features/shared/components/Input";
import { Alert } from "@/features/shared/components/Alert";
import { authService, mapAuthError, isSupabaseConfigured } from "../services/authService";

export function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!email.trim() || !password) {
      setFormError("Ingresa tu correo y contraseña.");
      return;
    }
    setLoading(true);
    try {
      await authService.signIn(email.trim(), password);
      navigate({ to: "/bienvenida" });
    } catch (err) {
      setFormError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      {!isSupabaseConfigured && (
        <Alert variant="warning">
          El backend aún no está conectado a este proyecto. Conecta Supabase para activar el
          inicio de sesión.
        </Alert>
      )}
      {formError && <Alert variant="error">{formError}</Alert>}
      <Input
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
        required
      />
      <Input
        label="Contraseña"
        revealable
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
        required
      />
      <div className="text-right">
        <Link
          to="/recuperar-password"
          className="text-sm font-medium text-primary hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
      <Button type="submit" loading={loading} fullWidth>
        Iniciar sesión
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link to="/registro" className="font-medium text-primary hover:underline">
          Regístrate
        </Link>
      </p>
    </form>
  );
}
