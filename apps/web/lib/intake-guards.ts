export function assertLeadIntakeMutable(status: string) {
  if (status === "submitted") {
    throw new Error("This intake has already been submitted.")
  }
}

export function assertRequiredAnswerValue(
  label: string,
  value: unknown
) {
  if (Array.isArray(value) && value.length === 0) {
    throw new Error(`Missing answers for: ${label}`)
  }

  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing answers for: ${label}`)
  }
}
