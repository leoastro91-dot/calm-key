import { createFileRoute } from "@tanstack/react-router";
import { AuthLayout, PublicOnly } from "@/features/identity/components/AuthLayout";
import { LoginForm } from "@/features/identity/components/LoginForm";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión — Finance OS" },
      { name: "description", content: "Accede a tu plan financiero personal en Finance OS." },
      { property: "og:title", content: "Iniciar sesión — Finance OS" },
      { property: "og:description", content: "Accede a tu plan financiero personal en Finance OS." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <PublicOnly>
      <AuthLayout title="Inicia sesión" subtitle="Nos alegra verte de nuevo.">
        <LoginForm />
      </AuthLayout>
    </PublicOnly>
  );
}
