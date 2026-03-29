import Link from "next/link";
import { ArrowRight, BarChart3, ShieldCheck, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <main className="min-h-dvh px-5 py-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="sticky top-4 z-20 mb-8 rounded-full border border-[color:var(--border)] bg-white/80 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--muted-ink)]">
                ShowReady
              </p>
              <p className="text-sm text-[color:var(--muted-ink)]">
                Smart buyer pre-qualification for busy agents
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-[color:var(--ink)]">
                Sign in
              </Link>
              <Link href="/register">
                <Button>Start free</Button>
              </Link>
            </div>
          </div>
        </header>
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <Badge tone="neutral">Luxury-editorial UX, built for daily triage</Badge>
            <h1 className="mt-6 max-w-3xl font-display text-5xl leading-[1.05] text-[color:var(--ink)] md:text-6xl">
              Decide who is ready for a showing before you lose another afternoon.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[color:var(--muted-ink)]">
              ShowReady gives every new inquiry a branded two-minute intake, a deterministic
              readiness score, and a clear recommendation so agents spend time where deals are
              actually likely to close.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/register">
                <Button size="lg">
                  Create your workspace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="lg">
                  Use demo account
                </Button>
              </Link>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { label: "2 min intake", value: "Frictionless buyer flow" },
                { label: "0 black box AI", value: "Transparent logic score" },
                { label: "7 day magic link", value: "Works on every phone" }
              ].map((metric) => (
                <Card key={metric.label} className="p-5">
                  <p className="font-display text-3xl text-[color:var(--ink)]">{metric.label}</p>
                  <p className="mt-2 text-sm text-[color:var(--muted-ink)]">{metric.value}</p>
                </Card>
              ))}
            </div>
          </div>
          <Card className="overflow-hidden border-[color:var(--border)] bg-[color:var(--surface)]">
            <div className="border-b border-[color:var(--border)] bg-[color:var(--surface-strong)] p-6">
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--muted-ink)]">
                Live score preview
              </p>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-3xl">Jordan Wells</h2>
                  <p className="mt-1 text-sm text-[color:var(--muted-ink)]">
                    Relocating for work. Pre-approved. Has toured a few homes.
                  </p>
                </div>
                <div className="rounded-full bg-[color:var(--ready-soft)] px-4 py-2 font-mono text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--ready)]">
                  Ready
                </div>
              </div>
            </div>
            <div className="grid gap-6 p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Timeline urgency", value: "10 / 10" },
                  { label: "Financing strength", value: "9 / 10" },
                  { label: "Commitment signal", value: "8 / 10" },
                  { label: "Market awareness", value: "5 / 10" }
                ].map((item) => (
                  <div key={item.label} className="rounded-3xl bg-[color:var(--muted)] p-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
                      {item.label}
                    </p>
                    <p className="mt-2 text-xl font-semibold text-[color:var(--ink)]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
              <Card className="bg-[#103f3b] p-5 text-white">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-[#facc15]" />
                  <p className="font-semibold">Recommendation</p>
                </div>
                <p className="mt-3 leading-7 text-white/80">
                  Score 8.82/10. Strengths: strong timeline urgency, solid financing
                  (pre_approved), high offer readiness, motivated by urgency. Recommend booking
                  a showing now.
                </p>
              </Card>
            </div>
          </Card>
        </section>
        <section className="mt-16 grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "Trust the recommendation",
              body: "Every score is auditable. Agents can see how timeline, financing, motivation, commitment, and market awareness all contributed."
            },
            {
              title: "Make the intake feel premium",
              body: "The buyer-facing form looks like your brand, not another off-the-shelf questionnaire."
            },
            {
              title: "Work from anywhere",
              body: "Review recent leads, adjust pipeline stages, and act from a mobile dashboard that still feels editorial instead of utilitarian."
            }
          ].map((item) => (
            <Card key={item.title} className="p-6">
              <p className="font-display text-2xl text-[color:var(--ink)]">{item.title}</p>
              <p className="mt-3 leading-7 text-[color:var(--muted-ink)]">{item.body}</p>
            </Card>
          ))}
        </section>
        <section className="mt-16 grid gap-6 lg:grid-cols-3">
          {[
            { icon: ShieldCheck, label: "Scoped lead data", body: "Each agent only sees their own pipeline." },
            { icon: BarChart3, label: "Explainable scoring", body: "No hidden AI calls or mystery adjustments." },
            { icon: Sparkles, label: "A polished first impression", body: "A fast, high-trust experience for both agent and buyer." }
          ].map(({ icon: Icon, label, body }) => (
            <Card key={label} className="p-6">
              <Icon className="h-5 w-5 text-[color:var(--brand)]" />
              <p className="mt-4 font-semibold text-[color:var(--ink)]">{label}</p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--muted-ink)]">{body}</p>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
