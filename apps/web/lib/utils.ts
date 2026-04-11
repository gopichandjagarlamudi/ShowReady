import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatScore(score?: number) {
  if (typeof score !== "number") {
    return "0.00"
  }

  return score.toFixed(2)
}

export function formatDate(value?: string) {
  if (!value) {
    return "Not available"
  }

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value))
}

export function formatCalendarDate(value?: string) {
  if (!value) {
    return "Not available"
  }

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium"
  }).format(new Date(`${value}T00:00:00`))
}

export function formatClockTime(value?: string) {
  if (!value) {
    return "Not available"
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeStyle: "short"
  }).format(new Date(`1970-01-01T${value}`))
}

export function getRecommendationLabel(recommendation?: string) {
  if (recommendation === "show") {
    return "Ready to show"
  }

  if (recommendation === "nurture") {
    return "Nurture"
  }

  return "Hold"
}

export function getRecommendationTone(recommendation?: string) {
  if (recommendation === "show") {
    return "ready"
  }

  if (recommendation === "nurture") {
    return "nurture"
  }

  return "hold"
}

export function buildAppUrl(pathname: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
    .trim()
    .replace(/\/+$/, "")
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`

  return `${baseUrl}${normalizedPath}`
}
