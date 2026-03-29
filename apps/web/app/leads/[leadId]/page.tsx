import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ScoreRing } from "@/components/score-ring";
import { RecommendationBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { buildAppUrl, formatDate } from "@/lib/utils";
import { getCurrentAgentContext } from "@/lib/session";
import { overrideLeadScoreAction, updateLeadStageAction } from "@/lib/actions";
import { getLeadById } from "@/lib/supabase/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LeadDetailPage({
  params
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  const context = await getCurrentAgentContext();

  if (!context) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient()
  const lead = await getLeadById(supabase, context.agent.id, leadId);
  if (!lead) {
    notFound();
  }

  return (
    <AppShell currentPath="/leads" eyebrow="Lead detail" heading={lead.buyerName}>
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card className="h-fit p-6 xl:sticky xl:top-28">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[color:var(--muted-ink)]">
                Recommendation
              </p>
              <div className="mt-3">
                <RecommendationBadge recommendation={lead.recommendation} />
              </div>
            </div>
            <ScoreRing score={lead.score} />
          </div>
          <p className="mt-6 text-sm leading-7 text-[color:var(--muted-ink)]">
            {lead.summary ?? "This lead is waiting on a completed intake."}
          </p>
          <div className="mt-6 rounded-[24px] bg-[color:var(--surface-strong)] p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
              Magic link
            </p>
            <p className="mt-2 break-all text-sm text-[color:var(--ink)]">
              {buildAppUrl(`/intake/${lead.token}`)}
            </p>
          </div>
          <form action={updateLeadStageAction} className="mt-6 grid gap-3">
            <input type="hidden" name="leadId" value={lead.id} />
            {["ready", "nurture", "hold", "closed"].map((stage) => (
              <Button key={stage} type="submit" variant="secondary" name="pipelineStage" value={stage}>
                Move to {stage}
              </Button>
            ))}
          </form>
        </Card>
        <div className="space-y-6">
          <Card className="p-6">
            <p className="font-display text-3xl text-[color:var(--ink)]">Lead context</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-ink)]">
                  Contact
                </p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--ink)]">
                  {lead.buyerEmail ?? lead.buyerPhone ?? "No contact detail yet"}
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-ink)]">
                  Last updated
                </p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--ink)]">{formatDate(lead.updatedAt)}</p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {lead.scoreBreakdown
                ? Object.entries(lead.scoreBreakdown).map(([key, value]) => (
                    <div
                      key={key}
                      className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4"
                    >
                      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-ink)]">
                        {key}
                      </p>
                      <p className="mt-2 text-xl font-semibold capitalize text-[color:var(--ink)]">
                        {value} / 10
                      </p>
                    </div>
                  ))
                : null}
            </div>
          </Card>
          <Card className="p-6">
            <p className="font-display text-3xl text-[color:var(--ink)]">Buyer answers</p>
            <div className="mt-5 grid gap-4">
              {Object.entries(lead.answers ?? {}).map(([key, value]) => (
                <div key={key} className="rounded-[24px] bg-[color:var(--surface-strong)] p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-ink)]">
                    {key}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--ink)]">
                    {Array.isArray(value) ? value.join(", ") : String(value)}
                  </p>
                </div>
              ))}
              {Object.entries(lead.customAnswers ?? {}).map(([key, value]) => (
                <div key={key} className="rounded-[24px] bg-[color:var(--surface-strong)] p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-ink)]">
                    {key}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--ink)]">
                    {Array.isArray(value) ? value.join(", ") : String(value)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <p className="font-display text-3xl text-[color:var(--ink)]">Override the score</p>
            <p className="mt-3 text-sm leading-7 text-[color:var(--muted-ink)]">
              Overrides preserve the original score and note exactly why you changed it.
            </p>
            <form action={overrideLeadScoreAction} className="mt-6 grid gap-4">
              <input type="hidden" name="leadId" value={lead.id} />
              <div>
                <label htmlFor="overrideScore" className="mb-2 block text-sm font-medium">
                  Override score
                </label>
                <Input id="overrideScore" name="overrideScore" type="number" min="1" max="10" step="0.1" required />
              </div>
              <div>
                <label htmlFor="overrideNote" className="mb-2 block text-sm font-medium">
                  Why are you overriding the score?
                </label>
                <Textarea id="overrideNote" name="overrideNote" required />
              </div>
              <Button type="submit">Save override</Button>
            </form>
            {lead.scoreOverride ? (
              <div className="mt-6 rounded-[24px] bg-[color:var(--surface-strong)] p-4 text-sm leading-7 text-[color:var(--muted-ink)]">
                Original score {lead.scoreOverride.originalScore.toFixed(2)} ({lead.scoreOverride.originalRecommendation}) was overridden to{" "}
                {lead.scoreOverride.overrideScore.toFixed(2)} ({lead.scoreOverride.overrideRecommendation}) on{" "}
                {formatDate(lead.scoreOverride.createdAt)}.
                <br />
                Note: {lead.scoreOverride.note}
              </div>
            ) : null}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
