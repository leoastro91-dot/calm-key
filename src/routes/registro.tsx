import { createFileRoute } from "@tanstack/react-router";
import { AuthLayout, PublicOnly } from "@/features/identity/components/AuthLayout";
import { RegisterForm } from "@/features/identity/components/RegisterForm";

export const Route = createFileRoute("/registro")({
  head: () => ({
    meta: [
      { title: "Crear cuenta — Finance OS" },
      { name: "description", content: "Regístrate en Finance OS y toma el control de tu plan financiero personal." },
      { property: "og:title", content: "Crear cuenta — Finance OS" },
      { property: "og:description", content: "Regístrate en Finance OS y toma el control de tu plan financiero personal." },
    ],
  }),
  component: RegistroPage,
});

function RegistroPage() {
  return (
    <PublicOnly>
      <AuthLayout
        title="Crea tu cuenta"
        subtitle="Tu información financiera, privada y bajo tu control."
      >
        <RegisterForm />
      </AuthLayout>
    </PublicOnly>
  );
}
