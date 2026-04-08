import { NextResponse } from "next/server";
import { trackServerEvent } from "@/lib/analytics";
import { buildAuthRedirectPath, sanitizeAuthNextPath } from "@/lib/auth-url";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureAgentScaffold } from "@/lib/supabase/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = sanitizeAuthNextPath(requestUrl.searchParams.get("next"))
  const vercelShareToken = requestUrl.searchParams.get("_vercel_share")

  if (!code) {
    return NextResponse.redirect(
      new URL(
        buildAuthRedirectPath("/login", {
          error: "Unable to verify your sign in link.",
          vercelShareToken
        }),
        request.url
      )
    )
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      new URL(
        buildAuthRedirectPath("/login", {
          error: error.message,
          vercelShareToken
        }),
        request.url
      )
    )
  }

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(
      new URL(
        buildAuthRedirectPath("/login", {
          error: "No active user was returned from Supabase.",
          vercelShareToken
        }),
        request.url
      )
    )
  }

  const admin = createSupabaseAdminClient()
  await ensureAgentScaffold(admin, user)
  await trackServerEvent("auth.login", { method: "google" }, user.id)

  return NextResponse.redirect(
    new URL(
      buildAuthRedirectPath(next, {
        vercelShareToken
      }),
      request.url
    )
  )
}
