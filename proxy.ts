import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/proxy"

const protectedPrefixes = [
  "/dashboard",
  "/leads",
  "/settings",
  "/api/leads",
  "/api/analytics/summary",
  "/api/notifications/test"
]

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname.startsWith(prefix))
}

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request)

  if (!isProtectedPath(request.nextUrl.pathname) || user) {
    return response
  }

  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = "/login"
  redirectUrl.searchParams.set("error", "Please sign in to continue.")

  return NextResponse.redirect(redirectUrl)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
}
