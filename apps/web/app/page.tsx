import Link from "next/link"
import { ArrowRight, BarChart3, ShieldCheck, Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const proofItems = [
  {
    icon: BarChart3,
    title: "Explainable scoring",
    body: "A clear recommendation backed by visible inputs your team can actually defend."
  },
  {
    icon: Sparkles,
    title: "Branded intake",
    body: "A polished buyer questionnaire that feels like your process, not a generic form."
  },
  {
    icon: ShieldCheck,
    title: "Private agent workspace",
    body: "Each agent works from a separate pipeline with lead data scoped to their account."
  }
]

const scoreItems = [
  { label: "Timeline urgency", value: "10 / 10" },
  { label: "Financing strength", value: "9 / 10" },
  { label: "Commitment signal", value: "8 / 10" },
  { label: "Market awareness", value: "5 / 10" }
]

export default function HomePage() {
  return (
    <main className="min-h-dvh px-5 py-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="sticky top-4 z-20 mb-10 rounded-full border border-[color:var(--border)] bg-white/80 px-5 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--muted-ink)]">
              ShowReady
            </p>
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

        <section className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="max-w-2xl">
            <Badge tone="neutral">Pre-qualify before the showing</Badge>
            <h1 className="mt-5 max-w-2xl font-display text-5xl leading-[1.05] text-[color:var(--ink)] md:text-6xl">
              Know who is ready before you book the showing.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[color:var(--muted-ink)]">
              ShowReady gives every inquiry a branded intake, a clear readiness score, and a
              recommendation your team can actually explain.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/register">
                <Button size="lg">
                  Create your workspace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <Card className="overflow-hidden border-[color:var(--border)] bg-[color:var(--surface)]">
            <div className="border-b border-[color:var(--border)] bg-[color:var(--surface-strong)] p-6 sm:p-7">
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--muted-ink)]">
                Live score preview
              </p>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-3xl text-[color:var(--ink)]">Jordan Wells</h2>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--muted-ink)]">
                    Relocating for work. Pre-approved. Has toured a few homes.
                  </p>
                </div>
                <div className="rounded-full bg-[color:var(--ready-soft)] px-4 py-2 font-mono text-sm font-semibold uppercase tracking-[0.24em] text-[color:var(--ready)]">
                  Ready
                </div>
              </div>
            </div>
            <div className="grid gap-6 p-6 sm:p-7">
              <div className="grid gap-3 sm:grid-cols-2">
                {scoreItems.map((item) => (
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
                  Score 8.82/10. Strong urgency, reliable financing, and high offer readiness.
                  Recommend moving this lead to an active showing.
                </p>
              </Card>
            </div>
          </Card>
        </section>

        <section className="mt-20 grid gap-6 lg:grid-cols-3">
          {proofItems.map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.title} className="p-6">
                <Icon className="h-5 w-5 text-[color:var(--brand)]" />
                <p className="mt-4 font-display text-2xl text-[color:var(--ink)]">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-[color:var(--muted-ink)]">
                  {item.body}
                </p>
              </Card>
            )
          })}
        </section>

        <section className="mt-20 pb-8">
          <Card className="flex flex-col gap-6 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="max-w-2xl">
              <p className="font-display text-3xl text-[color:var(--ink)]">
                Bring more discipline to the first conversation.
              </p>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted-ink)]">
                Start with a branded intake and give every new inquiry a clearer next step.
              </p>
            </div>
            <Link href="/register">
              <Button size="lg">Create your workspace</Button>
            </Link>
          </Card>
        </section>
      </div>
    </main>
  )
}
