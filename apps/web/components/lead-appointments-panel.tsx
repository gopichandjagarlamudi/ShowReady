import Link from "next/link"
import type { Appointment, Lead } from "@showready/types"
import { updateAppointmentStatusAction } from "@/lib/actions"
import { canCreateAppointmentForLead } from "@/lib/appointments"
import { AppointmentForm } from "@/components/appointment-form"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatCalendarDate, formatClockTime } from "@/lib/utils"

type LeadAppointmentsPanelProps = {
  lead: Lead
  appointments: Appointment[]
}

export function LeadAppointmentsPanel({ lead, appointments }: LeadAppointmentsPanelProps) {
  const scheduledAppointment = appointments.find((appointment) => appointment.status === "scheduled")
  const history = appointments.filter((appointment) => appointment.status !== "scheduled")
  const leadSummary: Appointment["lead"] = {
    id: lead.id,
    buyerName: lead.buyerName,
    buyerPhone: lead.buyerPhone,
    buyerEmail: lead.buyerEmail,
    pipelineStage: lead.pipelineStage
  }

  return (
    <Card className="p-6">
      <p className="font-display text-3xl text-[color:var(--ink)]">Appointments</p>
      <p className="mt-3 text-sm leading-7 text-[color:var(--muted-ink)]">
        Manage the current showing plan and keep prior completed or cancelled appointments attached to this lead.
      </p>

      {scheduledAppointment ? (
        <div className="mt-6 rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-ink)]">
                Current scheduled appointment
              </p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--ink)]">
                {formatCalendarDate(scheduledAppointment.date)} at {formatClockTime(scheduledAppointment.startTime)}
              </p>
              <p className="mt-1 text-sm text-[color:var(--muted-ink)]">
                {scheduledAppointment.showings.length}{" "}
                {scheduledAppointment.showings.length === 1 ? "showing" : "showings"}
              </p>
              {scheduledAppointment.notes ? (
                <p className="mt-3 text-sm leading-7 text-[color:var(--muted-ink)]">
                  {scheduledAppointment.notes}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <form action={updateAppointmentStatusAction}>
                <input type="hidden" name="appointmentId" value={scheduledAppointment.id} />
                <input type="hidden" name="leadId" value={lead.id} />
                <input type="hidden" name="status" value="completed" />
                <Button type="submit" variant="secondary" size="sm">
                  Mark completed
                </Button>
              </form>
              <form action={updateAppointmentStatusAction}>
                <input type="hidden" name="appointmentId" value={scheduledAppointment.id} />
                <input type="hidden" name="leadId" value={lead.id} />
                <input type="hidden" name="status" value="cancelled" />
                <Button type="submit" variant="ghost" size="sm">
                  Cancel appointment
                </Button>
              </form>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {scheduledAppointment.showings.map((showing, index) => (
              <div
                key={showing.id}
                className="rounded-[24px] border border-[color:var(--border)] bg-white p-4"
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
        </div>
      ) : null}

      {scheduledAppointment || canCreateAppointmentForLead(lead.pipelineStage) ? (
        <div className="mt-6">
          <AppointmentForm
            appointment={scheduledAppointment}
            eligibleLeads={[]}
            lockedLead={leadSummary}
            heading={scheduledAppointment ? "Edit appointment" : "Create appointment"}
            description={
              scheduledAppointment
                ? "Adjust the date, time, and showing order for this scheduled appointment."
                : "Create the first appointment for this reviewed lead."
            }
          />
        </div>
      ) : (
        <div className="mt-6 rounded-[24px] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
          <p className="text-sm leading-6 text-[color:var(--muted-ink)]">
            Move this lead into ready to show, nurture, or hold before creating a new appointment.
          </p>
        </div>
      )}

      <div className="mt-6 space-y-4">
        <div>
          <p className="font-display text-2xl text-[color:var(--ink)]">History</p>
          <p className="mt-2 text-sm text-[color:var(--muted-ink)]">
            Completed and cancelled appointments stay attached here for context.
          </p>
        </div>

        {history.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
            <p className="text-sm leading-6 text-[color:var(--muted-ink)]">
              No completed or cancelled appointments yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {history.map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-[color:var(--ink)]">
                      {formatCalendarDate(appointment.date)} at {formatClockTime(appointment.startTime)}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--muted-ink)]">
                      {appointment.status === "completed" ? "Completed" : "Cancelled"} ·{" "}
                      {appointment.showings.length}{" "}
                      {appointment.showings.length === 1 ? "showing" : "showings"}
                    </p>
                  </div>
                  <Link
                    href={`/appointments?tab=${appointment.status}&appointmentId=${appointment.id}&leadId=${lead.id}`}
                  >
                    <Button type="button" variant="ghost" size="sm">
                      Edit
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
