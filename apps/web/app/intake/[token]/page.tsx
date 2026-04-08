import { Card } from "@/components/ui/card"
import { IntakeForm } from "@/components/intake-form"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { getLeadIntakeContext } from "@/lib/supabase/data"

export default async function IntakePage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createSupabaseAdminClient()
  const context = await getLeadIntakeContext(supabase, token)

  if (!context) {
    return (
      <main className="grid min-h-dvh place-items-center px-5 py-10">
        <Card className="max-w-xl p-8 text-center">
          <p className="font-display text-4xl text-[color:var(--ink)]">This link is no longer available</p>
          <p className="mt-4 text-[color:var(--muted-ink)]">
            Ask your agent to send you a fresh intake link.
          </p>
        </Card>
      </main>
    );
  }

  if (context.isExpired) {
    return (
      <main className="grid min-h-dvh place-items-center px-5 py-10">
        <Card className="max-w-xl p-8 text-center">
          <p className="font-display text-4xl text-[color:var(--ink)]">Your intake link expired</p>
          <p className="mt-4 text-[color:var(--muted-ink)]">
            No problem. Reach back out to {context.agent.fullName} and they can send a new one.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-dvh py-6">
      <IntakeForm
        token={token}
        agentName={context.agent.fullName}
        brandName={context.settings.brandName}
        brandColor={context.settings.brandColor}
        accentColor={context.settings.accentColor}
        saleTemplate={context.templates.sale}
        rentalTemplate={context.templates.rental}
        initialDraft={context.draft}
      />
    </main>
  );
}
