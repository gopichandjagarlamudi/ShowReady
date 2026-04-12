"use client"

import { useId, useState } from "react"
import type { Appointment } from "@showready/types"
import { saveAppointmentAction } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type AppointmentFormProps = {
  appointment?: Appointment
  eligibleLeads: Appointment["lead"][]
  selectedLeadId?: string
  lockedLead?: Appointment["lead"]
  heading: string
  description: string
}

type ShowingDraft = {
  id: string
  address: string
  notes: string
}

function buildShowingDrafts(appointment?: Appointment): ShowingDraft[] {
  if (!appointment || appointment.showings.length === 0) {
    return [
      {
        id: "showing-0",
        address: "",
        notes: ""
      }
    ]
  }

  return appointment.showings.map((showing, index) => ({
    id: `${showing.id}-${index}`,
    address: showing.address,
    notes: showing.notes ?? ""
  }))
}

export function AppointmentForm({
  appointment,
  eligibleLeads,
  selectedLeadId,
  lockedLead,
  heading,
  description
}: AppointmentFormProps) {
  const formResetKey = [
    appointment?.id ?? "new",
    appointment?.date ?? "",
    appointment?.startTime ?? "",
    lockedLead?.id ?? "",
    selectedLeadId ?? "",
    eligibleLeads.map((lead) => lead.id).join(",")
  ].join(":")

  return (
    <AppointmentFormInner
      key={formResetKey}
      appointment={appointment}
      eligibleLeads={eligibleLeads}
      selectedLeadId={selectedLeadId}
      lockedLead={lockedLead}
      heading={heading}
      description={description}
    />
  )
}

function AppointmentFormInner({
  appointment,
  eligibleLeads,
  selectedLeadId,
  lockedLead,
  heading,
  description
}: AppointmentFormProps) {
  const formId = useId()
  const leadFieldId = `${formId}-lead`
  const dateFieldId = `${formId}-date`
  const startTimeFieldId = `${formId}-start-time`
  const notesFieldId = `${formId}-notes`
  const [leadId, setLeadId] = useState(
    lockedLead?.id ?? selectedLeadId ?? eligibleLeads[0]?.id ?? appointment?.lead.id ?? ""
  )
  const [date, setDate] = useState(appointment?.date ?? "")
  const [startTime, setStartTime] = useState(appointment?.startTime ?? "")
  const [notes, setNotes] = useState(appointment?.notes ?? "")
  const [showings, setShowings] = useState<ShowingDraft[]>(buildShowingDrafts(appointment))

  const noEligibleLeads = !lockedLead && !appointment && eligibleLeads.length === 0

  function updateShowing(id: string, key: "address" | "notes", value: string) {
    setShowings((current) =>
      current.map((showing) => (showing.id === id ? { ...showing, [key]: value } : showing))
    )
  }

  function addShowing() {
    setShowings((current) => [
      ...current,
      {
        id: `showing-${current.length + 1}-${Date.now()}`,
        address: "",
        notes: ""
      }
    ])
  }

  function removeShowing(id: string) {
    setShowings((current) => {
      if (current.length === 1) {
        return current
      }

      return current.filter((showing) => showing.id !== id)
    })
  }

  function moveShowing(id: string, direction: -1 | 1) {
    setShowings((current) => {
      const index = current.findIndex((showing) => showing.id === id)
      const nextIndex = index + direction

      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) {
        return current
      }

      const next = current.slice()
      const [item] = next.splice(index, 1)
      next.splice(nextIndex, 0, item)
      return next
    })
  }

  return (
    <Card className="p-6">
      <p className="font-display text-3xl text-[color:var(--ink)]">{heading}</p>
      <p className="mt-3 text-sm leading-7 text-[color:var(--muted-ink)]">{description}</p>

      {noEligibleLeads ? (
        <div className="mt-6 rounded-[24px] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
          <p className="text-sm leading-6 text-[color:var(--muted-ink)]">
            There are no reviewed ready, nurture, or hold leads available for a new appointment right now.
          </p>
        </div>
      ) : (
        <form action={saveAppointmentAction} className="mt-6 space-y-5">
          {appointment ? <input type="hidden" name="appointmentId" value={appointment.id} /> : null}

          <div>
            {lockedLead ? (
              <>
                <input type="hidden" name="leadId" value={lockedLead.id} />
                <p className="mb-2 block text-sm font-medium text-[color:var(--ink)]">Lead</p>
                <div className="min-h-11 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 text-sm text-[color:var(--ink)]">
                  {lockedLead.buyerName}
                </div>
              </>
            ) : (
              <>
                <label className="mb-2 block text-sm font-medium text-[color:var(--ink)]" htmlFor={leadFieldId}>
                  Lead
                </label>
                <select
                  id={leadFieldId}
                  name="leadId"
                  value={leadId}
                  onChange={(event) => setLeadId(event.target.value)}
                  className="min-h-11 w-full rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm text-[color:var(--ink)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                  required
                >
                  {eligibleLeads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.buyerName}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[color:var(--ink)]" htmlFor={dateFieldId}>
                Date
              </label>
              <Input
                id={dateFieldId}
                name="date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[color:var(--ink)]" htmlFor={startTimeFieldId}>
                Start time
              </label>
              <Input
                id={startTimeFieldId}
                name="startTime"
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[color:var(--ink)]" htmlFor={notesFieldId}>
              Notes
            </label>
            <Textarea
              id={notesFieldId}
              name="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Parking, buyer preferences, access instructions, or anything else the team should know."
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-display text-2xl text-[color:var(--ink)]">Showings</p>
                <p className="mt-1 text-sm text-[color:var(--muted-ink)]">
                  Add at least one address. Use the arrows to set the visit order.
                </p>
              </div>
              <Button type="button" variant="secondary" onClick={addShowing}>
                Add showing
              </Button>
            </div>

            <div className="space-y-4">
              {showings.map((showing, index) => (
                (() => {
                  const addressFieldId = `${formId}-${showing.id}-address`
                  const showingNotesFieldId = `${formId}-${showing.id}-notes`

                  return (
                    <div
                      key={showing.id}
                      className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted-ink)]">
                          Showing {index + 1}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => moveShowing(showing.id, -1)}
                            disabled={index === 0}
                          >
                            Up
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => moveShowing(showing.id, 1)}
                            disabled={index === showings.length - 1}
                          >
                            Down
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeShowing(showing.id)}
                            disabled={showings.length === 1}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 space-y-4">
                        <div>
                          <label
                            className="mb-2 block text-sm font-medium text-[color:var(--ink)]"
                            htmlFor={addressFieldId}
                          >
                            Address
                          </label>
                          <Input
                            id={addressFieldId}
                            name="showingAddress"
                            value={showing.address}
                            onChange={(event) => updateShowing(showing.id, "address", event.target.value)}
                            placeholder="123 King St W, Toronto"
                            required
                          />
                        </div>
                        <div>
                          <label
                            className="mb-2 block text-sm font-medium text-[color:var(--ink)]"
                            htmlFor={showingNotesFieldId}
                          >
                            Showing notes
                          </label>
                          <Textarea
                            id={showingNotesFieldId}
                            name="showingNotes"
                            value={showing.notes}
                            onChange={(event) => updateShowing(showing.id, "notes", event.target.value)}
                            placeholder="Access details, unit notes, or anything to remember for this stop."
                          />
                        </div>
                      </div>
                    </div>
                  )
                })()
              ))}
            </div>
          </div>

          <Button type="submit">{appointment ? "Save appointment" : "Create appointment"}</Button>
        </form>
      )}
    </Card>
  )
}
