import { AlertTriangle } from "lucide-react";

interface Props {
  pocketName: string;
}

/**
 * Aviso visual (no bloqueante) cuando el bolsillo origen es 'protected'.
 * El traslado se registrará como 'emergency_use'.
 */
export function ProtectedPocketWarning({ pocketName }: Props) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2.5 text-sm text-warning"
    >
      <AlertTriangle size={18} aria-hidden className="mt-0.5 shrink-0" />
      <p>
        Estás retirando de un bolsillo protegido (<strong>{pocketName}</strong>).
        El movimiento quedará marcado como uso de emergencia para que puedas
        identificarlo después.
      </p>
    </div>
  );
}
