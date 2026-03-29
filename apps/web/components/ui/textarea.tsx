import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-[28px] border border-[color:var(--border)] bg-white px-4 py-3 text-sm text-[color:var(--ink)] shadow-sm transition placeholder:text-[color:var(--muted-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]",
        className
      )}
      {...props}
    />
  );
}
