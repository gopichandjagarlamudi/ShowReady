import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FormField({
  label,
  helper,
  children,
  className
}: {
  label: string;
  helper?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div>
        <p className="text-sm font-medium text-[color:var(--ink)]">{label}</p>
        {helper ? (
          <p className="mt-1 text-sm text-[color:var(--muted-ink)]">{helper}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
