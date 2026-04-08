import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LiveRefresh } from "@/components/live-refresh";
import { LeadCard } from "@/components/lead-card";
import { createLeadAction } from "@/lib/actions";
import { getCurrentAgentContext } from "@/lib/session";
import { getAnalyticsSummary, listLeads } from "@/lib/supabase/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const context = await getCurrentAgentContext();
  if (!context) {
    redirect("/login");
  }

  if (!context.agent.onboardedAt) {
    redirect("/settings?onboarding=1");
  }

  const supabase = await createSupabaseServerClient()

  const [summary, leads] = await Promise.all([
    getAnalyticsSummary(supabase, context.agent.id),
    listLeads(supabase, context.agent.id)
  ]);

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
            New lead launcher
          </p>
          <h2 className="mt-4 font-display text-3xl text-[color:var(--ink)]">
            Send a magic link in under a minute
          </h2>
          <form action={createLeadAction} className="mt-6 space-y-4">
            <div>
              <label htmlFor="buyerName" className="mb-2 block text-sm font-medium">
                Buyer name
              </label>
              <Input id="buyerName" name="buyerName" required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="intakeType" className="mb-2 block text-sm font-medium">
                  Intake type
                </label>
                <select
                  id="intakeType"
                  name="intakeType"
                  defaultValue="sale"
                  className="min-h-11 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm"
                >
                  <option value="sale">Sale questionnaire</option>
                  <option value="rental">Rental questionnaire</option>
                </select>
              </div>
              <div>
                <label htmlFor="buyerEmail" className="mb-2 block text-sm font-medium">
                  Buyer email
                </label>
                <Input id="buyerEmail" name="buyerEmail" type="email" />
              </div>
              <div>
                <label htmlFor="buyerPhone" className="mb-2 block text-sm font-medium">
                  Buyer phone
                </label>
                <Input id="buyerPhone" name="buyerPhone" type="tel" />
              </div>
            </div>
            <p className="text-sm leading-7 text-[color:var(--muted-ink)]">
              Choose the questionnaire first, then add at least one contact method. The lead detail
              page will generate the shareable intake link automatically.
            </p>
            <Button type="submit" className="w-full">
              Create lead
            </Button>
          </form>
        </Card>
      </section>
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-3xl text-[color:var(--ink)]">Recent leads</p>
            <p className="mt-2 text-sm text-[color:var(--muted-ink)]">
              The latest buyers to enter your qualification pipeline.
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
