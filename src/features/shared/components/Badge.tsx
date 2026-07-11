import { cn } from "@/lib/utils";
import type { AccountStatus } from "@/features/identity/domain/types";

const statusStyles: Record<string, string> = {
  onboarding: "bg-warning/15 text-warning border-warning/30",
  active: "bg-success/15 text-success border-success/30",
  suspended: "bg-destructive/15 text-destructive border-destructive/30",
};

const statusLabels: Record<string, string> = {
  onboarding: "En configuración",
  active: "Activa",
  suspended: "Suspendida",
};

export function Badge({
  status,
  className,
}: {
  status: AccountStatus | string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status] ?? "bg-muted text-muted-foreground border-border",
        className,
      )}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}
