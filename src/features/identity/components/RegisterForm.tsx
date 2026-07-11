import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/features/shared/components/Button";
import { Input } from "@/features/shared/components/Input";
import { Alert } from "@/features/shared/components/Alert";
import { authService, mapAuthError, isSupabaseConfigured } from "../services/authService";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterForm() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [emailPending, setEmailPending] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (fullName.trim().length < 2) errs.fullName = "Ingresa tu nombre completo.";
    if (!EMAIL_RE.test(email.trim())) errs.email = "Ingresa un correo válido.";
    if (password.length < 8) errs.password = "La contraseña debe tener al menos 8 caracteres.";
    if (confirm !== password) errs.confirm = "Las contraseñas no coinciden.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const { session } = await authService.signUp(email.trim(), password, fullName.trim());
      if (session) {
        // onAuthStateChange (SIGNED_IN) se encarga del INSERT en profiles.
        navigate({ to: "/bienvenida" });
      } else {
        // Confirmación de email activa en el proyecto.
        setEmailPending(true);
      }
    } catch (err) {
      setFormError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  if (emailPending) {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="success">
          Revisa tu correo: te enviamos un enlace para confirmar tu cuenta antes de iniciar
          sesión.
        </Alert>
        <Link to="/login" className="text-center text-sm font-medium text-primary hover:underline">
          Volver a inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      {!isSupabaseConfigured && (
        <Alert variant="warning">
          El backend aún no está conectado a este proyecto. Conecta Supabase para activar el
          registro.
        </Alert>
      )}
      {formError && (
        <Alert variant="error">
          {formError}{" "}
          {formError.includes("iniciar sesión") && (
            <Link to="/login" className="font-medium underline">
              Ir a inicio de sesión
            </Link>
          )}
        </Alert>
      )}
      <Input
        label="Nombre completo"
        autoComplete="name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        error={fieldErrors.fullName}
        disabled={loading}
        required
      />
      <Input
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email}
        disabled={loading}
        required
      />
      <Input
        label="Contraseña"
        revealable
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors.password}
        helperText="Mínimo 8 caracteres."
        disabled={loading}
        required
      />
      <Input
        label="Confirmar contraseña"
        revealable
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={fieldErrors.confirm}
        disabled={loading}
        required
      />
      <Button type="submit" loading={loading} fullWidth className="mt-2">
        Crear mi cuenta
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
