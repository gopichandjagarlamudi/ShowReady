import { redirect } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { NewLeadsInbox } from "@/components/new-leads-inbox"
import { getCurrentAgentContext } from "@/lib/session"
import { listNewLeadsForReview } from "@/lib/supabase/data"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function NewLeadsPage() {
  const context = await getCurrentAgentContext()
  if (!context) {
    redirect("/login")
  }

  const supabase = await createSupabaseServerClient()
  const leads = await listNewLeadsForReview(supabase, context.agent.id)

  return (
    <AppShell currentPath="/new-leads" eyebrow={context.settings.brandName} heading="New Leads">
      <NewLeadsInbox leads={leads} />
    </AppShell>
  )
}
