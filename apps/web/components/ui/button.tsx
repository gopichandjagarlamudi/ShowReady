import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[color:var(--brand)] text-white shadow-[var(--shadow-soft)] hover:bg-[#115e59]",
        secondary:
          "border border-[color:var(--border)] bg-white text-[color:var(--ink)] hover:bg-[color:var(--muted)]",
        ghost:
          "bg-transparent text-[color:var(--ink)] hover:bg-[color:var(--muted)]",
        accent:
          "bg-[color:var(--accent)] text-white hover:bg-[#8f6a06]"
      },
      size: {
        md: "px-5 py-3",
        sm: "px-4 py-2.5 text-xs",
        lg: "px-6 py-3.5"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>
>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
