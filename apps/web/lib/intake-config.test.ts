import { describe, expect, it } from "vitest"
import type { QuestionTemplate } from "@showready/types"
import {
  getCoreQuestionsForIntakeType,
  getDefaultTemplateForIntakeType,
  resolveTemplateForIntakeType
} from "./intake-config"

function makeTemplate(
  overrides: Partial<QuestionTemplate> & Pick<QuestionTemplate, "id" | "intakeType">
): QuestionTemplate {
  return {
    id: overrides.id,
    intakeType: overrides.intakeType,
    name: overrides.name ?? `${overrides.intakeType} template`,
    introHeadline: overrides.introHeadline ?? "Headline",
    introBody: overrides.introBody ?? "Body",
    customQuestions: overrides.customQuestions ?? []
  }
}

describe("intake-config", () => {
  it("returns sale questions for sale leads", () => {
    const questions = getCoreQuestionsForIntakeType("sale")

    expect(questions[0]?.label).toMatch(/timeline to move/i)
    expect(questions[1]?.label).toMatch(/mortgage/i)
  })

  it("returns rental questions for rental leads", () => {
    const questions = getCoreQuestionsForIntakeType("rental")

    expect(questions[0]?.label).toMatch(/timeline to move/i)
    expect(questions[1]?.label).toMatch(/lease|income|documents/i)
  })

  it("returns a rental default template with rental-specific copy", () => {
    const template = getDefaultTemplateForIntakeType("rental")

    expect(template.intakeType).toBe("rental")
    expect(template.introHeadline).toMatch(/rental|lease/i)
  })

  it("selects the template matching the requested intake type", () => {
    const template = resolveTemplateForIntakeType("rental", [
      makeTemplate({ id: "sale-template", intakeType: "sale" }),
      makeTemplate({
        id: "rental-template",
        intakeType: "rental",
        introHeadline: "Rental flow"
      })
    ])

    expect(template.id).toBe("rental-template")
    expect(template.introHeadline).toBe("Rental flow")
  })

  it("falls back to a sale template when legacy templates have no intake type", () => {
    const template = resolveTemplateForIntakeType("sale", [
      {
        ...makeTemplate({ id: "legacy-template", intakeType: "sale" }),
        intakeType: undefined as unknown as "sale"
      }
    ])

    expect(template.id).toBe("legacy-template")
  })

  it("throws when the requested template type is missing", () => {
    expect(() =>
      resolveTemplateForIntakeType("rental", [
        makeTemplate({ id: "sale-template", intakeType: "sale" })
      ])
    ).toThrow("Question template not found for intake type rental.")
  })
})
