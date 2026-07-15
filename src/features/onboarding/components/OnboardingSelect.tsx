import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface Props extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label: string;
  options: Option[];
  helperText?: string;
}

export const OnboardingSelect = forwardRef<HTMLSelectElement, Props>(
  ({ label, options, helperText, id, className, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
        <select
          ref={ref}
          id={inputId}
          className={cn(
            "min-h-11 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-base text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring",
            className,
          )}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {helperText && (
          <p className="text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  },
);
OnboardingSelect.displayName = "OnboardingSelect";
