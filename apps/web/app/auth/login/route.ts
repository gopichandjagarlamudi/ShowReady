import { NextResponse } from "next/server"
import { signInWithPassword } from "@/lib/auth-flow"

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const formData = await request.formData()
  const location = await signInWithPassword(formData, {
    vercelShareToken: requestUrl.searchParams.get("_vercel_share")
  })

  return NextResponse.redirect(new URL(location, request.url), {
    status: 303
  })
}
