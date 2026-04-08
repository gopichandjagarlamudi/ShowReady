import { describe, expect, test } from "vitest";
import { scoreLead } from "../src/index";
import type {
  BuyerQuestionnaireAnswers,
  LeadContactInfo,
  RentalQuestionnaireAnswers
} from "@showready/types";

const contact: LeadContactInfo = {
  fullName: "Sofia Chen",
  email: "sofia@example.com",
  phone: "+1 416 555 0101"
}

const buyerAnswers: BuyerQuestionnaireAnswers = {
  buyingFor: "myself",
  timeline: "asap",
  budgetKnowledge: "know_it",
  mortgageStatus: "pre_approved",
  neighborhoods: "Leslieville, Riverdale",
  propertyType: "detached",
  bedrooms: "3+",
  bathrooms: "2+",
  mustHaves: ["backyard", "parking"],
  workedWithAnotherRealtor: "no",
  additionalContext: "Need a backyard for the dog."
}

const rentalAnswers: RentalQuestionnaireAnswers = {
  moveTimeline: "within_1_month",
  rentRange: "$2,000–$2,500/mo",
  neighborhoods: "Liberty Village",
  placeType: "condo",
  bedrooms: "1",
  hasPets: "no",
  occupantCount: "2",
  incomeProof: "yes",
  preferredMoveInDate: "2026-05-01",
  mustHaves: ["laundry", "near_transit"],
  rentedInCanadaBefore: "yes",
  additionalContext: "Need easy subway access."
};

describe("scoreLead", () => {
  test("scores a strong buyer as show with a buyer-specific next action", () => {
    const result = scoreLead(
      {
        contact,
        intent: "buy",
        buyer: buyerAnswers
      },
      8
    );

    expect(result.total).toBeGreaterThanOrEqual(8);
    expect(result.recommendation).toBe("show");
    expect(result.breakdown.urgency).toBeGreaterThanOrEqual(8);
    expect(result.summary).toContain("buyer");
    expect(result.nextAction).toContain("showing")
  });

  test("keeps underprepared buyers in nurture territory", () => {
    const result = scoreLead(
      {
        contact,
        intent: "buy",
        buyer: {
          ...buyerAnswers,
          budgetKnowledge: "not_yet",
          mortgageStatus: "not_yet",
          workedWithAnotherRealtor: "yes"
        }
      },
      8
    );

    expect(result.total).toBeLessThan(8)
    expect(["nurture", "hold"]).toContain(result.recommendation)
    expect(result.summary).toContain("financing")
  });

  test("applies a custom show threshold per agent for buyers", () => {
    const result = scoreLead(
      {
        contact,
        intent: "buy",
        buyer: {
          ...buyerAnswers,
          timeline: "1_3_months",
          buyingFor: "investment"
        }
      },
      8.5
    );

    expect(result.recommendation).toBe("nurture");
  });

  test("scores prepared renters with a rental-specific next action", () => {
    const result = scoreLead(
      {
        contact,
        intent: "rent",
        rental: rentalAnswers
      },
      8
    );

    expect(result.total).toBeGreaterThan(6)
    expect(["show", "nurture"]).toContain(result.recommendation)
    expect(result.nextAction).toContain("rental")
  });
});
