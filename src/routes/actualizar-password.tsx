import { createFileRoute } from "@tanstack/react-router";
import { AuthLayout } from "@/features/identity/components/AuthLayout";
import { UpdatePasswordForm } from "@/features/identity/components/UpdatePasswordForm";

export const Route = createFileRoute("/actualizar-password")({
  // La sesión temporal de recuperación vive en el cliente.
  ssr: false,
  head: () => ({
    meta: [
      { title: "Nueva contraseña — Finance OS" },
      { name: "description", content: "Define una nueva contraseña para tu cuenta de Finance OS." },
      { property: "og:title", content: "Nueva contraseña — Finance OS" },
      { property: "og:description", content: "Define una nueva contraseña para tu cuenta de Finance OS." },
    ],
  }),
  component: ActualizarPage,
});

function ActualizarPage() {
  return (
    <AuthLayout title="Define tu nueva contraseña">
      <UpdatePasswordForm />
    </AuthLayout>
  );
}
