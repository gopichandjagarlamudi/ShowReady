import type { HTMLAttributes, PropsWithChildren } from "react";
import { cn, getRecommendationTone } from "@/lib/utils";

type BadgeTone = "neutral" | "ready" | "nurture" | "hold";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-[color:var(--muted)] text-[color:var(--muted-ink)]",
  ready: "bg-[color:var(--ready-soft)] text-[color:var(--ready)]",
  nurture: "bg-[color:var(--nurture-soft)] text-[color:var(--nurture)]",
  hold: "bg-[color:var(--hold-soft)] text-[color:var(--hold)]"
};

export function Badge({
  className,
  children,
  tone = "neutral",
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLSpanElement>> & {
  tone?: BadgeTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function RecommendationBadge({
  recommendation
}: {
  recommendation?: string;
}) {
  const tone = getRecommendationTone(recommendation) as BadgeTone;
  const label =
    recommendation === "show"
      ? "Ready"
      : recommendation === "nurture"
        ? "Nurture"
        : "Hold";
  return <Badge tone={tone}>{label}</Badge>;
}
