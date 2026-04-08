import { buildAppUrl } from "./utils"

type AuthRedirectOptions = {
  error?: string
  message?: string
  next?: string
  vercelShareToken?: string | null
}

function buildPath(pathname: string, searchParams: URLSearchParams) {
  const query = searchParams.toString()
  return query ? `${pathname}?${query}` : pathname
}

export function buildAuthActionPath(
  pathname: string,
  vercelShareToken?: string | null
) {
  const searchParams = new URLSearchParams()

  if (vercelShareToken) {
    searchParams.set("_vercel_share", vercelShareToken)
  }

  return buildPath(pathname, searchParams)
}

export function buildAuthRedirectPath(
  pathname: string,
  {
    error,
    message,
    next,
    vercelShareToken
  }: AuthRedirectOptions = {}
) {
  const searchParams = new URLSearchParams()

  if (vercelShareToken) {
    searchParams.set("_vercel_share", vercelShareToken)
  }

  if (error) {
    searchParams.set("error", error)
  }

  if (message) {
    searchParams.set("message", message)
  }

  if (next) {
    searchParams.set("next", next)
  }

  return buildPath(pathname, searchParams)
}

export function sanitizeAuthNextPath(next?: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard"
  }

  return next
}

export function buildAuthCallbackUrl(vercelShareToken?: string | null) {
  const callbackPath = buildAuthActionPath("/auth/callback", vercelShareToken)
  return buildAppUrl(callbackPath)
}
