import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GeneratedLinkPanel } from "@/components/generated-link-panel";
import { LiveRefresh } from "@/components/live-refresh";
import { LeadCard } from "@/components/lead-card";
import { createInviteAction } from "@/lib/actions";
import { getCurrentAgentContext } from "@/lib/session";
import { buildAppUrl } from "@/lib/utils";
import { getAnalyticsSummary, listInvites, listLeads } from "@/lib/supabase/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: Promise<{ invite?: string }>
}) {
  const context = await getCurrentAgentContext();
  if (!context) {
    redirect("/login");
  }

  if (!context.agent.onboardedAt) {
    redirect("/settings?onboarding=1");
  }

  const supabase = await createSupabaseServerClient()
  const query = searchParams ? await searchParams : undefined

  const [summary, leads, invites] = await Promise.all([
    getAnalyticsSummary(supabase, context.agent.id),
    listLeads(supabase, context.agent.id),
    listInvites(supabase, context.agent.id)
  ]);
  const latestInviteFromQuery =
    query?.invite ? invites.find((invite) => invite.token === query.invite) : undefined
  const latestActiveInvite = invites.find((invite) => invite.status !== "converted")
  const latestInvite = latestInviteFromQuery ?? latestActiveInvite

  return (
    <AppShell
      currentPath="/dashboard"
      eyebrow={context.settings.brandName}
      heading={`Good morning, ${context.agent.fullName.split(" ")[0]}`}
    >
      <LiveRefresh agentId={context.agent.id} />
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
            Pipeline pulse
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Ready", value: summary.ready, tone: "var(--ready-soft)" },
              { label: "Nurture", value: summary.nurture, tone: "var(--nurture-soft)" },
              { label: "Hold", value: summary.hold, tone: "var(--hold-soft)" }
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[24px] p-5"
                style={{ backgroundColor: item.tone }}
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-ink)]">
                  {item.label}
                </p>
                <p className="mt-2 font-display text-4xl text-[color:var(--ink)]">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-ink)]">
                Average score
              </p>
              <p className="mt-2 text-3xl font-semibold text-[color:var(--ink)]">
                {summary.averageScore.toFixed(2)}
              </p>
            </div>
            <div className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-ink)]">
                Total leads
              </p>
              <p className="mt-2 text-3xl font-semibold text-[color:var(--ink)]">
                {summary.totalLeads}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
            Invite launcher
          </p>
          <h2 className="mt-4 font-display text-3xl text-[color:var(--ink)]">
            Generate a magic link in under a minute
          </h2>
          <form action={createInviteAction} className="mt-6 space-y-4">
            <p className="text-sm leading-7 text-[color:var(--muted-ink)]">
              The lead will add their name, contact details, and whether they are buying or renting
              after opening the link. You only need to generate and share the invite.
            </p>
            <Button type="submit" className="w-full">
              Generate invite link
            </Button>
          </form>
          <GeneratedLinkPanel
            inviteUrl={
              latestInvite ? buildAppUrl(`/intake/${latestInvite.token}`) : undefined
            }
            invitePath={latestInvite ? `/intake/${latestInvite.token}` : undefined}
            status={latestInvite?.status}
          />
        </Card>
      </section>
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-3xl text-[color:var(--ink)]">Recent leads</p>
            <p className="mt-2 text-sm text-[color:var(--muted-ink)]">
              Completed intakes move here once they become real leads in your pipeline.
            </p>
          </div>
          <Link href="/leads">
            <Button variant="secondary">View all leads</Button>
          </Link>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {leads.slice(0, 4).map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
