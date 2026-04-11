import { redirect } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { AppointmentsManager } from "@/components/appointments-manager"
import { getAppointmentTabFromSearchParam } from "@/lib/appointments"
import { getCurrentAgentContext } from "@/lib/session"
import {
  listAppointments,
  listEligibleLeadsForAppointments
} from "@/lib/supabase/data"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function AppointmentsPage({
  searchParams
}: {
  searchParams?: Promise<{ tab?: string; leadId?: string; appointmentId?: string }>
}) {
  const context = await getCurrentAgentContext()
  if (!context) {
    redirect("/login")
  }

  const query = searchParams ? await searchParams : undefined
  const tab = getAppointmentTabFromSearchParam(query?.tab)
  const supabase = await createSupabaseServerClient()

  const [upcoming, completed, cancelled, eligibleLeads] = await Promise.all([
    listAppointments(supabase, context.agent.id, "scheduled"),
    listAppointments(supabase, context.agent.id, "completed"),
    listAppointments(supabase, context.agent.id, "cancelled"),
    listEligibleLeadsForAppointments(supabase, context.agent.id)
  ])

  const allAppointments = [...upcoming, ...completed, ...cancelled]
  const selectedAppointment = query?.appointmentId
    ? allAppointments.find((appointment) => appointment.id === query.appointmentId)
    : undefined
  const appointments =
    tab === "completed" ? completed : tab === "cancelled" ? cancelled : upcoming
  const selectedLeadId = selectedAppointment
    ? selectedAppointment.lead.id
    : query?.leadId && eligibleLeads.some((lead) => lead.id === query.leadId)
      ? query.leadId
      : eligibleLeads[0]?.id

  return (
    <AppShell currentPath="/appointments" eyebrow={context.settings.brandName} heading="Appointments">
      <AppointmentsManager
        tab={tab}
        appointments={appointments}
        counts={{
          upcoming: upcoming.length,
          completed: completed.length,
          cancelled: cancelled.length
        }}
        eligibleLeads={eligibleLeads.map((lead) => ({
          id: lead.id,
          buyerName: lead.buyerName,
          buyerEmail: lead.buyerEmail,
          buyerPhone: lead.buyerPhone,
          pipelineStage: lead.pipelineStage
        }))}
        selectedLeadId={selectedLeadId}
        selectedAppointment={selectedAppointment}
      />
    </AppShell>
  )
}
