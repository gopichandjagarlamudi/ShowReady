import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { ensureAgentScaffold } from "@/lib/supabase/data"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { trackServerEvent } from "./analytics"
import {
  buildAuthCallbackUrl,
  buildAuthRedirectPath
} from "./auth-url"

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim()
}

type AuthFlowOptions = {
  vercelShareToken?: string | null
}

export async function signInWithPassword(
  formData: FormData,
  { vercelShareToken }: AuthFlowOptions = {}
) {
  const email = getString(formData, "email")
  const password = getString(formData, "password")
  const supabase = await createSupabaseServerClient()

  try {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      throw error
    }

    const userId = data.user.id
    const admin = createSupabaseAdminClient()
    await ensureAgentScaffold(admin, data.user)
    await trackServerEvent("auth.login", { method: "password" }, userId)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to sign in right now."

    return buildAuthRedirectPath("/login", {
      error: message,
      vercelShareToken
    })
  }

  return buildAuthRedirectPath("/dashboard", {
    vercelShareToken
  })
}

export async function registerWithPassword(
  formData: FormData,
  { vercelShareToken }: AuthFlowOptions = {}
) {
  const fullName = getString(formData, "fullName")
  const email = getString(formData, "email")
  const password = getString(formData, "password")
  const supabase = await createSupabaseServerClient()

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: buildAuthCallbackUrl(vercelShareToken),
        data: {
          full_name: fullName
        }
      }
    })

    if (error) {
      throw error
    }

    if (data.user) {
      const admin = createSupabaseAdminClient()
      await ensureAgentScaffold(admin, data.user)
      await trackServerEvent("auth.register", { method: "password" }, data.user.id)
    }

    if (!data.session) {
      return buildAuthRedirectPath("/login", {
        message: "Check your email to finish creating your account.",
        vercelShareToken
      })
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create your account."

    return buildAuthRedirectPath("/register", {
      error: message,
      vercelShareToken
    })
  }

  return buildAuthRedirectPath("/settings", {
    next: undefined,
    vercelShareToken
  }).replace(/\?$/, "") + (vercelShareToken ? "&onboarding=1" : "?onboarding=1")
}

export async function getGoogleSignInRedirect(
  { vercelShareToken }: AuthFlowOptions = {}
) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: buildAuthCallbackUrl(vercelShareToken)
    }
  })

  if (error || !data.url) {
    const message =
      error?.message ?? "Unable to start Google sign in right now."

    return buildAuthRedirectPath("/login", {
      error: message,
      vercelShareToken
    })
  }

  return data.url
}
