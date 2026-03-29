import { Card } from "@/components/ui/card";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getLeadIntakeContext } from "@/lib/supabase/data";

export default async function IntakeCompletePage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createSupabaseAdminClient()
  const context = await getLeadIntakeContext(supabase, token);

  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <Card className="max-w-2xl p-10 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-[color:var(--muted-ink)]">
          All set
        </p>
        <h1 className="mt-4 font-display text-5xl text-[color:var(--ink)]">
          Your agent has what they need.
        </h1>
        <p className="mt-5 text-lg leading-8 text-[color:var(--muted-ink)]">
          {context
            ? `${context.agent.fullName} will review your intake and follow up with next steps shortly.`
            : "Your intake was submitted successfully. Your agent will follow up shortly."}
        </p>
      </Card>
    </main>
  );
}
