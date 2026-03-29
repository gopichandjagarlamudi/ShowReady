import Link from "next/link";
import type { Lead } from "@showready/types";
import { RecommendationBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate, formatScore } from "@/lib/utils";

export function LeadCard({ lead }: { lead: Lead }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-2xl text-[color:var(--ink)]">{lead.buyerName}</p>
          <p className="mt-1 text-sm text-[color:var(--muted-ink)]">
            {lead.buyerEmail ?? lead.buyerPhone ?? "Awaiting contact details"}
          </p>
        </div>
        <RecommendationBadge recommendation={lead.recommendation} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted-ink)]">
            Score
          </p>
          <p className="mt-1 text-lg font-semibold text-[color:var(--ink)]">
            {lead.score ? formatScore(lead.score) : "Pending"}
          </p>
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted-ink)]">
            Stage
          </p>
          <p className="mt-1 text-lg font-semibold capitalize text-[color:var(--ink)]">
            {lead.pipelineStage}
          </p>
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted-ink)]">
            Updated
          </p>
          <p className="mt-1 text-sm text-[color:var(--ink)]">{formatDate(lead.updatedAt)}</p>
        </div>
      </div>
      {lead.summary ? (
        <p className="mt-4 text-sm leading-6 text-[color:var(--muted-ink)]">{lead.summary}</p>
      ) : (
        <p className="mt-4 text-sm leading-6 text-[color:var(--muted-ink)]">
          Intake has not been completed yet. Share the magic link to keep this lead moving.
        </p>
      )}
      <Link
        href={`/leads/${lead.id}`}
        className="mt-5 inline-flex text-sm font-medium text-[color:var(--brand)]"
      >
        Open lead detail
      </Link>
    </Card>
  );
}
