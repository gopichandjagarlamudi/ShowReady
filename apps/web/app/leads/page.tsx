import { redirect } from "next/navigation"
import type { LeadStage } from "@showready/types"
import { AppShell } from "@/components/app-shell"
import { LeadsManager } from "@/components/leads-manager"
import { getCurrentAgentContext } from "@/lib/session"
import { listLeadIdsWithScheduledAppointments, listLeads } from "@/lib/supabase/data"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const ACTIVE_TABS = ["ready_to_show", "appointment_booked", "nurture", "hold"] as const
const OUTCOME_TABS = ["closed_won", "closed_lost", "archived"] as const

function getTabValue<T extends readonly LeadStage[]>(
  value: string | string[] | undefined,
  allowed: T,
  fallback: T[number]
): T[number] {
  if (typeof value === "string" && allowed.includes(value as T[number])) {
    return value as T[number]
  }

  return fallback
}

export default async function LeadsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const context = await getCurrentAgentContext()
  if (!context) {
    redirect("/login")
  }

  const params = searchParams ? await searchParams : undefined
  const activeTab = getTabValue(params?.active, ACTIVE_TABS, "ready_to_show")
  const outcomeTab = getTabValue(params?.outcome, OUTCOME_TABS, "closed_won")

  const supabase = await createSupabaseServerClient()
  const leads = await listLeads(supabase, context.agent.id)
  const activeAppointmentLeadIds = await listLeadIdsWithScheduledAppointments(
    supabase,
    context.agent.id,
    leads.map((lead) => lead.id)
  )

  return (
    <AppShell currentPath="/leads" eyebrow={context.settings.brandName} heading="Pipeline">
      <LeadsManager
        leads={leads}
        activeAppointmentLeadIds={activeAppointmentLeadIds}
        activeTab={activeTab}
        outcomeTab={outcomeTab}
      />
    </AppShell>
  )
}
