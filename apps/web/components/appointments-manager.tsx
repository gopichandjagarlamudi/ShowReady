import Link from "next/link"
import type { Appointment } from "@showready/types"
import { updateAppointmentStatusAction } from "@/lib/actions"
import { type AppointmentTab } from "@/lib/appointments"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { StageBadge } from "@/components/ui/badge"
import { AppointmentForm } from "@/components/appointment-form"
import { formatCalendarDate, formatClockTime } from "@/lib/utils"

type AppointmentsManagerProps = {
  tab: AppointmentTab
  appointments: Appointment[]
  counts: Record<AppointmentTab, number>
  eligibleLeads: Appointment["lead"][]
  selectedLeadId?: string
  selectedAppointment?: Appointment
}

const TAB_LABELS: Record<AppointmentTab, string> = {
  upcoming: "Upcoming",
  completed: "Completed",
  cancelled: "Cancelled"
}

function buildTabHref(tab: AppointmentTab, selectedLeadId?: string, appointmentId?: string) {
  const searchParams = new URLSearchParams({ tab })

  if (selectedLeadId) {
    searchParams.set("leadId", selectedLeadId)
  }

  if (appointmentId) {
    searchParams.set("appointmentId", appointmentId)
  }

  return `/appointments?${searchParams.toString()}`
}

export function AppointmentsManager({
  tab,
  appointments,
  counts,
  eligibleLeads,
  selectedLeadId,
  selectedAppointment
}: AppointmentsManagerProps) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="p-6">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
            Appointment pulse
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {(["upcoming", "completed", "cancelled"] as const).map((entry) => (
              <div
                key={entry}
                className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5"
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-ink)]">
                  {TAB_LABELS[entry]}
                </p>
                <p className="mt-2 font-display text-4xl text-[color:var(--ink)]">{counts[entry]}</p>
              </div>
            ))}
          </div>
        </Card>

        <AppointmentForm
          appointment={selectedAppointment}
          eligibleLeads={eligibleLeads}
          selectedLeadId={selectedLeadId}
          lockedLead={selectedAppointment?.lead}
          heading={selectedAppointment ? "Edit appointment" : "Create appointment"}
          description={
            selectedAppointment
              ? "Adjust timing, notes, or showing order for this appointment."
              : "Pick a reviewed lead, set the time, and add the showing stops in visit order."
          }
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {(["upcoming", "completed", "cancelled"] as const).map((entry) => {
            const active = entry === tab

            return (
              <Link key={entry} href={buildTabHref(entry, selectedLeadId)}>
                <Button variant={active ? "primary" : "secondary"}>{TAB_LABELS[entry]}</Button>
              </Link>
            )
          })}
        </div>

        {appointments.length === 0 ? (
          <Card className="p-6">
            <p className="font-display text-2xl text-[color:var(--ink)]">No {TAB_LABELS[tab].toLowerCase()} appointments</p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--muted-ink)]">
              {tab === "upcoming"
                ? "Create an appointment from here or from lead detail when a reviewed lead is ready."
                : `Appointments marked ${TAB_LABELS[tab].toLowerCase()} will appear here.`}
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {appointments.map((appointment) => (
              <Card key={appointment.id} className="p-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-display text-3xl text-[color:var(--ink)]">{appointment.lead.buyerName}</p>
                      <StageBadge stage={appointment.lead.pipelineStage} />
                    </div>
                    <p className="mt-2 text-sm text-[color:var(--muted-ink)]">
                      {appointment.lead.buyerEmail ?? appointment.lead.buyerPhone ?? "Awaiting contact details"}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[color:var(--ink)]">
                      {formatCalendarDate(appointment.date)} at {formatClockTime(appointment.startTime)}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--muted-ink)]">
                      {appointment.showings.length} {appointment.showings.length === 1 ? "showing" : "showings"}
                    </p>
                    {appointment.notes ? (
                      <p className="mt-3 text-sm leading-7 text-[color:var(--muted-ink)]">{appointment.notes}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-col items-start gap-3 xl:items-end">
                    <Link href={buildTabHref(tab, appointment.lead.id, appointment.id)}>
                      <Button variant="secondary">Edit appointment</Button>
                    </Link>
                    <Link href={`/leads/${appointment.lead.id}`}>
                      <Button variant="ghost">Open lead</Button>
                    </Link>
                    {appointment.status === "scheduled" ? (
                      <div className="flex flex-wrap gap-2">
                        <form action={updateAppointmentStatusAction}>
                          <input type="hidden" name="appointmentId" value={appointment.id} />
                          <input type="hidden" name="leadId" value={appointment.lead.id} />
                          <input type="hidden" name="status" value="completed" />
                          <Button type="submit" variant="secondary" size="sm">
                            Mark completed
                          </Button>
                        </form>
                        <form action={updateAppointmentStatusAction}>
                          <input type="hidden" name="appointmentId" value={appointment.id} />
                          <input type="hidden" name="leadId" value={appointment.lead.id} />
                          <input type="hidden" name="status" value="cancelled" />
                          <Button type="submit" variant="ghost" size="sm">
                            Cancel appointment
                          </Button>
                        </form>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-2">
                  {appointment.showings.map((showing, index) => (
                    <div
                      key={showing.id}
                      className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4"
                    >
                      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-ink)]">
                        Stop {index + 1}
                      </p>
                      <p className="mt-2 text-sm font-medium text-[color:var(--ink)]">{showing.address}</p>
                      {showing.notes ? (
                        <p className="mt-2 text-sm leading-6 text-[color:var(--muted-ink)]">{showing.notes}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
