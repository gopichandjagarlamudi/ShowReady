import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { LeadsManager } from "@/components/leads-manager";
import { getCurrentAgentContext } from "@/lib/session";
import { listLeads } from "@/lib/supabase/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LeadsPage() {
  const context = await getCurrentAgentContext();
  if (!context) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient()
  const leads = await listLeads(supabase, context.agent.id)

  return (
    <AppShell currentPath="/leads" eyebrow={context.settings.brandName} heading="Pipeline">
      <LeadsManager leads={leads} />
    </AppShell>
  );
}
