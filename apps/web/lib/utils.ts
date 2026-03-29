import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScore(score?: number) {
  if (typeof score !== "number") {
    return "0.00";
  }

  return score.toFixed(2);
}

export function formatDate(value?: string) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function getRecommendationLabel(recommendation?: string) {
  if (recommendation === "show") {
    return "Ready";
  }

  if (recommendation === "nurture") {
    return "Nurture";
  }

  return "Hold";
}

export function getRecommendationTone(recommendation?: string) {
  if (recommendation === "show") {
    return "ready";
  }

  if (recommendation === "nurture") {
    return "nurture";
  }

  return "hold";
}

export function buildAppUrl(pathname: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}${pathname}`;
}
