import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  error?: string;
  icon?: ReactNode;
  /** Habilita el botón mostrar/ocultar para contraseñas */
  revealable?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, icon, revealable, type, className, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const [revealed, setRevealed] = useState(false);
    const effectiveType = revealable ? (revealed ? "text" : "password") : type;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={effectiveType}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            className={cn(
              "min-h-11 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-base text-foreground",
              "placeholder:text-muted-foreground/70",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
              "disabled:cursor-not-allowed disabled:opacity-60",
              icon && "pl-10",
              revealable && "pr-11",
              error && "border-destructive focus:ring-destructive",
              className,
            )}
            {...props}
          />
          {revealable && (
            <button
              type="button"
              onClick={() => setRevealed((v) => !v)}
              aria-label={revealed ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {revealed ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        <div aria-live="polite">
          {error ? (
            <p id={`${inputId}-error`} className="text-sm text-destructive">
              {error}
            </p>
          ) : helperText ? (
            <p id={`${inputId}-helper`} className="text-sm text-muted-foreground">
              {helperText}
            </p>
          ) : null}
        </div>
      </div>
    );
  },
);
Input.displayName = "Input";
