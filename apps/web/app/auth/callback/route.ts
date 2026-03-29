import { NextResponse } from "next/server";
import { trackServerEvent } from "@/lib/analytics";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureAgentScaffold } from "@/lib/supabase/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") ?? "/dashboard"

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=Unable to verify your sign in link.", request.url)
    )
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
    )
  }

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(
      new URL("/login?error=No active user was returned from Supabase.", request.url)
    )
  }

  const admin = createSupabaseAdminClient()
  await ensureAgentScaffold(admin, user)
  await trackServerEvent("auth.login", { method: "google" }, user.id)

  return NextResponse.redirect(new URL(next, request.url))
}
