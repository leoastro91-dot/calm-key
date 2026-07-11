import { createFileRoute } from "@tanstack/react-router";
import { AuthLayout } from "@/features/identity/components/AuthLayout";
import { RequestPasswordResetForm } from "@/features/identity/components/RequestPasswordResetForm";

export const Route = createFileRoute("/recuperar-password")({
  head: () => ({
    meta: [
      { title: "Recuperar contraseña — Finance OS" },
      { name: "description", content: "Solicita un enlace para restablecer tu contraseña de Finance OS." },
      { property: "og:title", content: "Recuperar contraseña — Finance OS" },
      { property: "og:description", content: "Solicita un enlace para restablecer tu contraseña de Finance OS." },
    ],
  }),
  component: RecuperarPage,
});

function RecuperarPage() {
  return (
    <AuthLayout
      title="Recupera tu contraseña"
      subtitle="Te enviaremos un enlace seguro a tu correo."
    >
      <RequestPasswordResetForm />
    </AuthLayout>
  );
}
