import {
  getCoreQuestionsForIntakeType as getSharedCoreQuestionsForIntakeType,
  getDefaultTemplateForIntakeType as getSharedDefaultTemplateForIntakeType,
  getOptionalQuestionsForIntent as getSharedOptionalQuestionsForIntent,
  getRequiredQuestionsForIntent as getSharedRequiredQuestionsForIntent,
  intakeTypeToIntent,
  type IntakeType,
  type QuestionDefinition,
  type QuestionTemplate
} from "@showready/types"

type TemplateLike = Omit<QuestionTemplate, "intakeType"> & {
  intakeType?: IntakeType
}

export function getCoreQuestionsForIntakeType(
  intakeType: IntakeType
): QuestionDefinition[] {
  return getSharedCoreQuestionsForIntakeType(intakeType)
}

export function getDefaultTemplateForIntakeType(
  intakeType: IntakeType
): QuestionTemplate {
  return getSharedDefaultTemplateForIntakeType(intakeType)
}

export function getRequiredQuestionsForIntent(intakeType: "sale" | "rental") {
  return getSharedRequiredQuestionsForIntent(intakeTypeToIntent(intakeType))
}

export function getOptionalQuestionsForIntent(intakeType: "sale" | "rental") {
  return getSharedOptionalQuestionsForIntent(intakeTypeToIntent(intakeType))
}

export function resolveTemplateForIntakeType(
  intakeType: IntakeType,
  templates: TemplateLike[]
): QuestionTemplate {
  const template = templates.find((entry) => {
    if (entry.intakeType) {
      return entry.intakeType === intakeType
    }

    return intakeType === "sale"
  })

  if (!template) {
    throw new Error(`Question template not found for intake type ${intakeType}.`)
  }

  return {
    ...template,
    intakeType: template.intakeType ?? "sale"
  }
}

export function formatIntakeTypeLabel(intakeType: IntakeType): string {
  return intakeType === "rental" ? "Rental" : "Sale"
}
