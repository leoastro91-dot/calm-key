import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/features/shared/components/Button";
import { useAuth } from "../hooks/useAuth";

export function LogoutButton() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onLogout = async () => {
    setLoading(true);
    try {
      await signOut();
    } finally {
      navigate({ to: "/login", replace: true });
    }
  };

  return (
    <Button variant="ghost" loading={loading} onClick={onLogout}>
      <LogOut size={18} aria-hidden />
      Cerrar sesión
    </Button>
  );
}
