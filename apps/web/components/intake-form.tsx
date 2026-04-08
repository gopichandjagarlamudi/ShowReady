"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import type {
  CustomQuestion,
  IntakeDraft,
  QuestionDefinition,
  QuestionTemplate
} from "@showready/types"
import {
  getOptionalQuestionsForIntent,
  getRequiredQuestionsForIntent,
  hasAnyContactMethod
} from "@showready/types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type IntakeFormProps = {
  token: string
  agentName: string
  brandName: string
  brandColor: string
  accentColor: string
  saleTemplate: QuestionTemplate
  rentalTemplate: QuestionTemplate
  initialDraft: IntakeDraft
}

type FlowStep =
  | { kind: "intro" }
  | { kind: "contact" }
  | { kind: "intent" }
  | { kind: "question"; question: QuestionDefinition; optional: boolean }
  | { kind: "custom"; question: CustomQuestion }

function customQuestionToFixed(question: CustomQuestion): QuestionDefinition {
  return {
    key: `custom.${question.id}`,
    label: question.label,
    helperText: question.helperText,
    required: question.required,
    type: question.type === "text" ? "textarea" : question.type,
    options: question.options
  }
}

export function IntakeForm({
  token,
  agentName,
  brandName,
  brandColor,
  accentColor,
  saleTemplate,
  rentalTemplate,
  initialDraft
}: IntakeFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<IntakeDraft>({
    contact: {
      fullName: initialDraft.contact.fullName ?? "",
      phone: initialDraft.contact.phone ?? "",
      email: initialDraft.contact.email ?? ""
    },
    intent: initialDraft.intent,
    buyer: initialDraft.buyer ?? {},
    rental: initialDraft.rental ?? {},
    customAnswers: initialDraft.customAnswers ?? {}
  })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const activeTemplate =
    draft.intent === "rent" ? rentalTemplate : saleTemplate
  const questionSteps = useMemo(() => {
    if (!draft.intent) {
      return []
    }

    const fixed = [
      ...getRequiredQuestionsForIntent(draft.intent).map((question) => ({
        kind: "question" as const,
        question,
        optional: false
      })),
      ...getOptionalQuestionsForIntent(draft.intent).map((question) => ({
        kind: "question" as const,
        question,
        optional: true
      }))
    ]
    const custom = activeTemplate.customQuestions.slice(0, 2).map((question) => ({
      kind: "custom" as const,
      question
    }))

    return [...fixed, ...custom]
  }, [activeTemplate.customQuestions, draft.intent])

  const steps: FlowStep[] = useMemo(
    () => [
      { kind: "intro" },
      { kind: "contact" },
      { kind: "intent" },
      ...questionSteps
    ],
    [questionSteps]
  )

  const activeStep = steps[step]
  const progress =
    step === 0 ? 0 : (step / Math.max(steps.length - 1, 1)) * 100

  async function persistDraft(nextDraft: IntakeDraft) {
    const response = await fetch(`/api/intake/${token}/autosave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draft: nextDraft
      })
    })

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string }
      throw new Error(payload.error ?? "Unable to save your progress.")
    }
  }

  function previous() {
    setError(null)
    setStep((current) => Math.max(current - 1, 0))
  }

  function next() {
    setError(null)
    setStep((current) => current + 1)
  }

  async function saveAndAdvance(nextDraft: IntakeDraft) {
    setDraft(nextDraft)
    await persistDraft(nextDraft)
    next()
  }

  async function saveContactAndAdvance() {
    if (!draft.contact.fullName.trim() || !hasAnyContactMethod(draft.contact)) {
      setError("Add your full name and at least one contact method.")
      return
    }

    await saveAndAdvance(draft)
  }

  async function saveIntent(intent: "buy" | "rent") {
    const nextDraft: IntakeDraft = {
      ...draft,
      intent,
      buyer: intent === "buy" ? draft.buyer ?? {} : {},
      rental: intent === "rent" ? draft.rental ?? {} : {},
      customAnswers: draft.customAnswers ?? {}
    }

    await saveAndAdvance(nextDraft)
  }

  function getQuestionValue(question: QuestionDefinition | CustomQuestion) {
    const key = "id" in question ? `custom.${question.id}` : question.key

    if (key.startsWith("buyer.")) {
      return draft.buyer?.[key.replace("buyer.", "") as keyof NonNullable<typeof draft.buyer>]
    }

    if (key.startsWith("rental.")) {
      return draft.rental?.[
        key.replace("rental.", "") as keyof NonNullable<typeof draft.rental>
      ]
    }

    return draft.customAnswers?.[key.replace("custom.", "")]
  }

  async function saveQuestionValue(question: QuestionDefinition, value: string | string[]) {
    const nextDraft: IntakeDraft = {
      ...draft,
      buyer: { ...(draft.buyer ?? {}) },
      rental: { ...(draft.rental ?? {}) },
      customAnswers: { ...(draft.customAnswers ?? {}) }
    }

    if (question.key.startsWith("buyer.")) {
      nextDraft.buyer = {
        ...(nextDraft.buyer ?? {}),
        [question.key.replace("buyer.", "")]: value
      }
    } else if (question.key.startsWith("rental.")) {
      nextDraft.rental = {
        ...(nextDraft.rental ?? {}),
        [question.key.replace("rental.", "")]: value
      }
    } else if (question.key.startsWith("custom.")) {
      nextDraft.customAnswers = {
        ...(nextDraft.customAnswers ?? {}),
        [question.key.replace("custom.", "")]: value
      }
    }

    await saveAndAdvance(nextDraft)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)

    const response = await fetch(`/api/intake/${token}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draft
      })
    })

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string }
      setError(payload.error ?? "Unable to submit your intake.")
      setSubmitting(false)
      return
    }

    router.push(`/intake/${token}/complete`)
  }

  async function skipOptionalStep(isLast: boolean) {
    if (isLast) {
      await handleSubmit()
      return
    }

    next()
  }

  const renderQuestionActions = (
    question: QuestionDefinition,
    optional: boolean
  ) => {
    const currentValue = getQuestionValue(question)
    const isLast = step === steps.length - 1

    if (question.type === "single_select") {
      return (
        <>
          {question.options?.map((option) => {
            const selected = currentValue === option.value

            return (
              <button
                key={option.value}
                type="button"
                onClick={async () => {
                  await saveQuestionValue(question, option.value)
                }}
                className={`flex min-h-14 w-full items-center justify-between rounded-[24px] border px-5 py-4 text-left text-base transition ${
                  selected
                    ? "border-transparent bg-[color:var(--brand)] text-white"
                    : "border-[color:var(--border)] bg-white text-[color:var(--ink)]"
                }`}
              >
                <span>{option.label}</span>
              </button>
            )
          })}
          {optional ? (
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => previous()}>
                Back
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  await skipOptionalStep(isLast)
                }}
              >
                Skip
              </Button>
            </div>
          ) : null}
        </>
      )
    }

    if (question.type === "multi_select") {
      const selectedValues = Array.isArray(currentValue) ? currentValue : []

      return (
        <>
          {question.options?.map((option) => {
            const selected = selectedValues.includes(option.value)

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  const nextValues = selected
                    ? selectedValues.filter((entry) => entry !== option.value)
                    : [...selectedValues, option.value]

                  setDraft((current) => ({
                    ...current,
                    buyer: question.key.startsWith("buyer.")
                      ? {
                          ...(current.buyer ?? {}),
                          [question.key.replace("buyer.", "")]: nextValues
                        }
                      : current.buyer,
                    rental: question.key.startsWith("rental.")
                      ? {
                          ...(current.rental ?? {}),
                          [question.key.replace("rental.", "")]: nextValues
                        }
                      : current.rental
                  }))
                }}
                className={`flex min-h-14 w-full items-center justify-between rounded-[24px] border px-5 py-4 text-left text-base transition ${
                  selected
                    ? "border-[color:var(--brand)] bg-[color:var(--ready-soft)] text-[color:var(--ink)]"
                    : "border-[color:var(--border)] bg-white text-[color:var(--ink)]"
                }`}
              >
                <span>{option.label}</span>
              </button>
            )
          })}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => previous()}
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={async () => {
                await saveQuestionValue(question, selectedValues)
              }}
            >
              {isLast ? "Submit" : optional ? "Continue" : "Save answer"}
            </Button>
          </div>
        </>
      )
    }

    const currentText = typeof currentValue === "string" ? currentValue : ""

    return (
      <>
        {question.type === "textarea" ? (
          <Textarea
            value={currentText}
            onChange={(event) => {
              const nextValue = event.target.value
              setDraft((current) => ({
                ...current,
                buyer: question.key.startsWith("buyer.")
                  ? {
                      ...(current.buyer ?? {}),
                      [question.key.replace("buyer.", "")]: nextValue
                    }
                  : current.buyer,
                rental: question.key.startsWith("rental.")
                  ? {
                      ...(current.rental ?? {}),
                      [question.key.replace("rental.", "")]: nextValue
                    }
                  : current.rental,
                customAnswers: question.key.startsWith("custom.")
                  ? {
                      ...(current.customAnswers ?? {}),
                      [question.key.replace("custom.", "")]: nextValue
                    }
                  : current.customAnswers
              }))
            }}
            placeholder={question.placeholder}
          />
        ) : (
          <Input
            type={question.type === "email" ? "email" : question.type === "tel" ? "tel" : "text"}
            value={currentText}
            onChange={(event) => {
              const nextValue = event.target.value
              setDraft((current) => ({
                ...current,
                buyer: question.key.startsWith("buyer.")
                  ? {
                      ...(current.buyer ?? {}),
                      [question.key.replace("buyer.", "")]: nextValue
                    }
                  : current.buyer,
                rental: question.key.startsWith("rental.")
                  ? {
                      ...(current.rental ?? {}),
                      [question.key.replace("rental.", "")]: nextValue
                    }
                  : current.rental,
                customAnswers: question.key.startsWith("custom.")
                  ? {
                      ...(current.customAnswers ?? {}),
                      [question.key.replace("custom.", "")]: nextValue
                    }
                  : current.customAnswers
              }))
            }}
            placeholder={question.placeholder}
          />
        )}
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={() => previous()}>
            Back
          </Button>
          {optional ? (
            <Button
              type="button"
              variant="secondary"
              onClick={async () => {
                await skipOptionalStep(isLast)
              }}
            >
              Skip
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={async () => {
              if (question.required && !currentText.trim()) {
                setError(`Please answer: ${question.label}`)
                return
              }

              if (isLast) {
                await handleSubmit()
                return
              }

              await saveQuestionValue(question, currentText)
            }}
          >
            {isLast ? "Submit" : "Continue"}
          </Button>
        </div>
      </>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-6">
      <Card className="overflow-hidden">
        <div className="p-6 text-white" style={{ backgroundColor: brandColor }}>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-white/70">
            {brandName}
          </p>
          <h1 className="mt-4 font-display text-4xl">
            {activeStep.kind === "intro"
              ? "This takes about 1 minute"
              : draft.intent === "rent"
                ? rentalTemplate.introHeadline
                : saleTemplate.introHeadline}
          </h1>
          <p className="mt-3 max-w-2xl text-white/85">
            {activeStep.kind === "intro"
              ? "A few quick answers now help your realtor follow up with the right next step."
              : draft.intent === "rent"
                ? rentalTemplate.introBody
                : saleTemplate.introBody}
          </p>
          <p className="mt-4 text-sm text-white/75">Prepared by {agentName}</p>
        </div>
        <div className="px-6 py-5">
          <div className="mb-6 h-2 overflow-hidden rounded-full bg-[color:var(--muted)]">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: accentColor }}
            />
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeStep.kind}-${step}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {activeStep.kind === "intro" ? (
                <div className="space-y-6">
                  <p className="text-base leading-7 text-[color:var(--muted-ink)]">
                    We’ll start with your contact info, then tailor a short buyer or rental
                    questionnaire based on what you need.
                  </p>
                  <Button type="button" onClick={() => next()}>
                    Start
                  </Button>
                </div>
              ) : null}

              {activeStep.kind === "contact" ? (
                <div className="space-y-4">
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
                    Step {step} of {steps.length - 1}
                  </p>
                  <h2 className="mt-4 font-display text-4xl text-[color:var(--ink)]">
                    Let’s start with your contact details
                  </h2>
                  <Input
                    placeholder="Full name"
                    value={draft.contact.fullName}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        contact: {
                          ...current.contact,
                          fullName: event.target.value
                        }
                      }))
                    }
                  />
                  <Input
                    type="tel"
                    placeholder="Phone number"
                    value={draft.contact.phone ?? ""}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        contact: {
                          ...current.contact,
                          phone: event.target.value
                        }
                      }))
                    }
                  />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={draft.contact.email ?? ""}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        contact: {
                          ...current.contact,
                          email: event.target.value
                        }
                      }))
                    }
                  />
                  <div className="flex gap-3">
                    <Button type="button" variant="secondary" onClick={() => previous()}>
                      Back
                    </Button>
                    <Button type="button" onClick={saveContactAndAdvance}>
                      Continue
                    </Button>
                  </div>
                </div>
              ) : null}

              {activeStep.kind === "intent" ? (
                <div className="space-y-4">
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
                    Step {step} of {steps.length - 1}
                  </p>
                  <h2 className="mt-4 font-display text-4xl text-[color:var(--ink)]">
                    Are you buying a property or renting?
                  </h2>
                  <button
                    type="button"
                    onClick={async () => saveIntent("buy")}
                    className="flex min-h-14 w-full items-center justify-between rounded-[24px] border border-[color:var(--border)] bg-white px-5 py-4 text-left text-base text-[color:var(--ink)] transition hover:border-[color:var(--brand)]"
                  >
                    Buying a property
                  </button>
                  <button
                    type="button"
                    onClick={async () => saveIntent("rent")}
                    className="flex min-h-14 w-full items-center justify-between rounded-[24px] border border-[color:var(--border)] bg-white px-5 py-4 text-left text-base text-[color:var(--ink)] transition hover:border-[color:var(--brand)]"
                  >
                    Renting
                  </button>
                  <Button type="button" variant="secondary" onClick={() => previous()}>
                    Back
                  </Button>
                </div>
              ) : null}

              {activeStep.kind === "question" ? (
                <div className="space-y-4">
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
                    Step {step} of {steps.length - 1}
                  </p>
                  <h2 className="mt-4 font-display text-4xl text-[color:var(--ink)]">
                    {activeStep.question.label}
                  </h2>
                  {activeStep.question.helperText ? (
                    <p className="text-base leading-7 text-[color:var(--muted-ink)]">
                      {activeStep.question.helperText}
                    </p>
                  ) : null}
                  <div className="space-y-4">
                    {renderQuestionActions(activeStep.question, activeStep.optional)}
                  </div>
                </div>
              ) : null}

              {activeStep.kind === "custom" ? (
                <div className="space-y-4">
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
                    Step {step} of {steps.length - 1}
                  </p>
                  <h2 className="mt-4 font-display text-4xl text-[color:var(--ink)]">
                    {activeStep.question.label}
                  </h2>
                  {activeStep.question.helperText ? (
                    <p className="text-base leading-7 text-[color:var(--muted-ink)]">
                      {activeStep.question.helperText}
                    </p>
                  ) : null}
                  <div className="space-y-4">
                    {renderQuestionActions(
                      customQuestionToFixed(activeStep.question),
                      !activeStep.question.required
                    )}
                  </div>
                </div>
              ) : null}

              {error ? (
                <p className="mt-6 text-sm text-red-600">{error}</p>
              ) : null}
              {submitting ? (
                <p className="mt-6 text-sm text-[color:var(--muted-ink)]">
                  Submitting your answers...
                </p>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </Card>
    </div>
  )
}
