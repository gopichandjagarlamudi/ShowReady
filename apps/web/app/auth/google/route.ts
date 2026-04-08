import { NextResponse } from "next/server"
import { getGoogleSignInRedirect } from "@/lib/auth-flow"

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const location = await getGoogleSignInRedirect({
    vercelShareToken: requestUrl.searchParams.get("_vercel_share")
  })

  return NextResponse.redirect(new URL(location, request.url), {
    status: 303
  })
}
