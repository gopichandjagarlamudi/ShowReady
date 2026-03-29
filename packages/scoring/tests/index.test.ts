import { describe, expect, test } from "vitest";
import { scoreLead } from "../src/index";
import type { IntakeAnswers } from "@showready/types";

const baseAnswers: IntakeAnswers = {
  timeline: "asap",
  financing: "pre_approved",
  budgetBand: "800k_1m",
  exclusiveAgent: "no",
  moveReasons: ["relocation", "job_change"],
  priorShowings: "few",
  offerReadiness: 4,
  notes: "Need a backyard for the dog."
};

describe("scoreLead", () => {
  test("scores a strong buyer as show with a detailed summary", () => {
    const result = scoreLead(baseAnswers, 8);

    expect(result.total).toBe(8.82);
    expect(result.recommendation).toBe("show");
    expect(result.breakdown.timeline).toBe(10);
    expect(result.summary).toContain("Recommend booking a showing now.");
    expect(result.summary).toContain("strong timeline urgency");
  });

  test("caps unfinanced urgent buyers into nurture territory", () => {
    const result = scoreLead(
      {
        ...baseAnswers,
        financing: "no"
      },
      8
    );

    expect(result.total).toBe(5);
    expect(result.recommendation).toBe("nurture");
    expect(result.summary).toContain("no financing in place");
  });

  test("applies a custom show threshold per agent", () => {
    const result = scoreLead(
      {
        ...baseAnswers,
        timeline: "1_3mo",
        moveReasons: ["upsizing"]
      },
      8.5
    );

    expect(result.total).toBe(7.42);
    expect(result.recommendation).toBe("nurture");
  });

  test("rewards cash buyers with immediate urgency", () => {
    const result = scoreLead(
      {
        ...baseAnswers,
        financing: "cash",
        priorShowings: "none"
      },
      8
    );

    expect(result.total).toBeGreaterThanOrEqual(8.5);
    expect(result.recommendation).toBe("show");
  });
});
