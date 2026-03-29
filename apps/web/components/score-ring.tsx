import type { CSSProperties } from "react";
import { formatScore } from "@/lib/utils";

export function ScoreRing({ score = 0 }: { score?: number }) {
  const degrees = Math.max(0, Math.min(360, (score / 10) * 360));
  return (
    <div className="relative grid h-32 w-32 place-items-center rounded-full bg-[conic-gradient(var(--brand)_0deg,var(--brand)_var(--degrees),var(--muted)_var(--degrees),var(--muted)_360deg)]"
      style={
        {
          "--degrees": `${degrees}deg`
        } as CSSProperties
      }
    >
      <div className="grid h-24 w-24 place-items-center rounded-full bg-[color:var(--surface)]">
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
            Score
          </p>
          <p className="mt-1 font-display text-3xl text-[color:var(--ink)]">
            {formatScore(score)}
          </p>
        </div>
      </div>
    </div>
  );
}
