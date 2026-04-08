import {
  canCreateLeadFromDraft,
  getQuestionLabel,
  getRequiredQuestionsForIntent,
  intentToIntakeType,
  type IntakeDraft,
  type IntakeSubmission,
  type IntakeType
} from "@showready/types"
import { assertRequiredAnswerValue } from "./intake-guards"

type LeadInput = {
  buyerName: string
  buyerPhone?: string
  buyerEmail?: string
  intakeType: IntakeType
}

type FlatDraftAnswers = Record<string, string | string[]>

function normalizeOptionalString(value?: string) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function flattenObject(
  prefix: string,
  value: Record<string, unknown>,
  target: FlatDraftAnswers
) {
  for (const [key, entry] of Object.entries(value)) {
    if (entry === undefined || entry === null || entry === "") {
      continue
    }

    if (Array.isArray(entry)) {
      if (entry.length > 0) {
        target[`${prefix}.${key}`] = entry as string[]
      }
      continue
    }

    target[`${prefix}.${key}`] = String(entry)
  }
}

export function buildLeadInputFromDraft(draft: IntakeDraft): LeadInput {
  if (!canCreateLeadFromDraft(draft) || !draft.intent) {
    throw new Error("Draft is not ready to create a lead.")
  }

  return {
    buyerName: draft.contact.fullName.trim(),
    buyerPhone: normalizeOptionalString(draft.contact.phone),
    buyerEmail: normalizeOptionalString(draft.contact.email),
    intakeType: intentToIntakeType(draft.intent)
  }
}

export function flattenDraftAnswers(draft: IntakeDraft): FlatDraftAnswers {
  const flattened: FlatDraftAnswers = {}

  flattenObject("contact", draft.contact as Record<string, unknown>, flattened)

  if (draft.intent) {
    flattened.intent = draft.intent
  }

  if (draft.buyer) {
    flattenObject("buyer", draft.buyer as Record<string, unknown>, flattened)
  }

  if (draft.rental) {
    flattenObject("rental", draft.rental as Record<string, unknown>, flattened)
  }

  for (const [key, value] of Object.entries(draft.customAnswers ?? {})) {
    if (Array.isArray(value)) {
      if (value.length > 0) {
        flattened[`custom.${key}`] = value
      }
      continue
    }

    if (value) {
      flattened[`custom.${key}`] = value
    }
  }

  return flattened
}

export function assertDraftSubmissionComplete(
  draft: IntakeDraft
): asserts draft is IntakeSubmission {
  if (!canCreateLeadFromDraft(draft) || !draft.intent) {
    throw new Error("Missing answers for: contact details, intent")
  }

  const missing = getRequiredQuestionsForIntent(draft.intent)
    .filter((question) => {
      const [scope, key] = question.key.split(".")
      const value =
        scope === "buyer"
          ? draft.buyer?.[key as keyof NonNullable<typeof draft.buyer>]
          : draft.rental?.[key as keyof NonNullable<typeof draft.rental>]

      try {
        assertRequiredAnswerValue(getQuestionLabel(question.key), value)
        return false
      } catch {
        return true
      }
    })
    .map((question) => getQuestionLabel(question.key))

  if (missing.length > 0) {
    throw new Error(`Missing answers for: ${missing.join(", ")}`)
  }
}
