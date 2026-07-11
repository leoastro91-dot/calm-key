import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-6 shadow-[0_1px_3px_oklch(0.26_0.02_246/0.06),0_8px_24px_oklch(0.26_0.02_246/0.05)] sm:p-8",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
