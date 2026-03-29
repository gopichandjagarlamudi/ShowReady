import type { LabelHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export function Label({
  className,
  children,
  ...props
}: PropsWithChildren<LabelHTMLAttributes<HTMLLabelElement>>) {
  return (
    <label
      className={cn("mb-2 block text-sm font-medium text-[color:var(--ink)]", className)}
      {...props}
    >
      {children}
    </label>
  );
}
