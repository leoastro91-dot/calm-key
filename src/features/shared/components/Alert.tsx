import type { ReactNode } from "react";
import { Info, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "info" | "success" | "warning" | "error";

const styles: Record<Variant, string> = {
  info: "bg-accent text-accent-foreground border-accent-foreground/20",
  success: "bg-success/10 text-success border-success/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  error: "bg-destructive/10 text-destructive border-destructive/30",
};

const icons: Record<Variant, ReactNode> = {
  info: <Info size={18} aria-hidden />,
  success: <CheckCircle2 size={18} aria-hidden />,
  warning: <AlertTriangle size={18} aria-hidden />,
  error: <XCircle size={18} aria-hidden />,
};

export function Alert({
  variant = "info",
  children,
  className,
}: {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      aria-live="polite"
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm",
        styles[variant],
        className,
      )}
    >
      <span className="mt-0.5 shrink-0">{icons[variant]}</span>
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}
