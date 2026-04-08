import { describe, expect, it } from "vitest"
import type { IntakeDraft } from "@showready/types"
import {
  assertDraftSubmissionComplete,
  buildLeadInputFromDraft,
  flattenDraftAnswers
} from "./intake-draft"

describe("intake draft helpers", () => {
  const buyerDraft: IntakeDraft = {
    contact: {
      fullName: "Taylor Brooks",
      email: "taylor@example.com"
    },
    intent: "buy",
    buyer: {
      buyingFor: "myself",
      timeline: "1_3_months",
      budgetKnowledge: "rough_idea",
      mortgageStatus: "not_yet",
      neighborhoods: "Riverdale",
      propertyType: "condo"
    },
    customAnswers: {
      "custom-1": "Needs parking"
    }
  }

  it("builds lead input from a ready invite draft", () => {
    expect(buildLeadInputFromDraft(buyerDraft)).toEqual({
      buyerName: "Taylor Brooks",
      buyerEmail: "taylor@example.com",
      buyerPhone: undefined,
      intakeType: "sale"
    })
  })

  it("flattens structured answers into persisted question rows", () => {
    expect(flattenDraftAnswers(buyerDraft)).toEqual({
      "contact.fullName": "Taylor Brooks",
      "contact.email": "taylor@example.com",
      intent: "buy",
      "buyer.buyingFor": "myself",
      "buyer.timeline": "1_3_months",
      "buyer.budgetKnowledge": "rough_idea",
      "buyer.mortgageStatus": "not_yet",
      "buyer.neighborhoods": "Riverdale",
      "buyer.propertyType": "condo",
      "custom.custom-1": "Needs parking"
    })
  })

  it("rejects submit attempts that are missing required branch answers", () => {
    expect(() =>
      assertDraftSubmissionComplete({
        contact: {
          fullName: "Taylor Brooks",
          email: "taylor@example.com"
        },
        intent: "rent",
        rental: {
          moveTimeline: "within_1_month"
        }
      })
    ).toThrow(/missing answers/i)
  })
})
