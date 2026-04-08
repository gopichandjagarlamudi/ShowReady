"use server";

import {
  completeOnboarding,
  createLead,
  ensureAgentScaffold,
  overrideLeadScore,
  updateLeadStage
} from "@/lib/supabase/data"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getCurrentAgentContext, getCurrentAgentId } from "./session"
import { trackServerEvent } from "./analytics"
import { buildAppUrl } from "./utils"

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim()
}

function parseCustomQuestions(formData: FormData) {
  return [0, 1]
    .map((index) => {
      const label = getString(formData, `customQuestionLabel${index}`);
      const type = getString(formData, `customQuestionType${index}`) as
        | "single_select"
        | "multi_select"
        | "text";
      const required = formData.get(`customQuestionRequired${index}`) === "on";
      const options = getString(formData, `customQuestionOptions${index}`)
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => ({ label: entry, value: entry.toLowerCase().replace(/\s+/g, "_") }));

      if (!label) {
        return null;
      }

      return {
        id: `custom-${index + 1}`,
        label,
        type: type || "text",
        required,
        options: type === "text" ? undefined : options
      }
    })
    .filter((question): question is NonNullable<typeof question> => Boolean(question))
}

export async function loginAction(formData: FormData) {
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
    redirect(`/login?error=${encodeURIComponent(message)}`)
  }

  redirect("/dashboard")
}

export async function registerAction(formData: FormData) {
  const fullName = getString(formData, "fullName")
  const email = getString(formData, "email")
  const password = getString(formData, "password")
  const supabase = await createSupabaseServerClient()

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: buildAppUrl("/auth/callback"),
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
      redirect("/login?message=Check your email to finish creating your account.")
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create your account."
    redirect(`/register?error=${encodeURIComponent(message)}`)
  }

  redirect("/settings?onboarding=1")
}

export async function signInWithGoogleAction() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: buildAppUrl("/auth/callback")
    }
  })

  if (error || !data.url) {
    const message =
      error?.message ?? "Unable to start Google sign in right now."
    redirect(`/login?error=${encodeURIComponent(message)}`)
  }

  redirect(data.url)
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect("/")
}

export async function saveSettingsAction(formData: FormData) {
  const agentId = await getCurrentAgentId()
  if (!agentId) {
    redirect("/login")
  }

  const supabase = await createSupabaseServerClient()
  await completeOnboarding(supabase, agentId, {
    fullName: getString(formData, "fullName"),
    brokerage: getString(formData, "brokerage"),
    licenseNumber: getString(formData, "licenseNumber"),
    brandName: getString(formData, "brandName"),
    brandColor: getString(formData, "brandColor"),
    accentColor: getString(formData, "accentColor"),
    showThreshold: Number(getString(formData, "showThreshold") || "8"),
    notificationPreference:
      (getString(formData, "notificationPreference") as "email" | "email_and_push") ||
      "email",
    intakeType: (getString(formData, "intakeType") as "sale" | "rental") || "sale",
    introHeadline: getString(formData, "introHeadline"),
    introBody: getString(formData, "introBody"),
    customQuestions: parseCustomQuestions(formData)
  })

  await trackServerEvent("onboarding.completed", {}, agentId)
  revalidatePath("/dashboard")
  revalidatePath("/settings")
  redirect("/dashboard?welcome=1")
}

export async function createLeadAction(formData: FormData) {
  const agentId = await getCurrentAgentId()
  if (!agentId) {
    redirect("/login")
  }

  const supabase = await createSupabaseServerClient()

  try {
    const lead = await createLead(supabase, agentId, {
      intakeType: (getString(formData, "intakeType") as "sale" | "rental") || "sale",
      buyerName: getString(formData, "buyerName"),
      buyerPhone: getString(formData, "buyerPhone"),
      buyerEmail: getString(formData, "buyerEmail")
    })

    await trackServerEvent(
      "lead.created",
      {
        hasEmail: Boolean(lead.buyerEmail),
        hasPhone: Boolean(lead.buyerPhone)
      },
      agentId
    )

    revalidatePath("/dashboard")
    revalidatePath("/leads")
    redirect(`/leads/${lead.id}?created=1`)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create the lead."
    redirect(`/dashboard?error=${encodeURIComponent(message)}`)
  }
}

export async function updateLeadStageAction(formData: FormData) {
  const agentId = await getCurrentAgentId()
  if (!agentId) {
    redirect("/login")
  }

  const leadId = getString(formData, "leadId")
  const pipelineStage = getString(formData, "pipelineStage") as
    | "new"
    | "ready"
    | "nurture"
    | "hold"
    | "closed"

  const supabase = await createSupabaseServerClient()
  await updateLeadStage(supabase, agentId, leadId, pipelineStage)
  await trackServerEvent(
    "lead.stage_changed",
    {
      pipelineStage
    },
    agentId
  )

  revalidatePath(`/leads/${leadId}`)
  revalidatePath("/dashboard")
  revalidatePath("/leads")
}

export async function overrideLeadScoreAction(formData: FormData) {
  const agentId = await getCurrentAgentId()
  if (!agentId) {
    redirect("/login")
  }

  const leadId = getString(formData, "leadId")
  const overrideScoreValue = Number(getString(formData, "overrideScore"))
  const note = getString(formData, "overrideNote")

  const supabase = await createSupabaseServerClient()
  await overrideLeadScore(
    supabase,
    agentId,
    leadId,
    overrideScoreValue,
    note
  )
  await trackServerEvent("lead.score_overridden", { overrideScoreValue }, agentId)

  revalidatePath(`/leads/${leadId}`)
  revalidatePath("/dashboard")
  revalidatePath("/leads")
}

export async function getDashboardContext() {
  return getCurrentAgentContext()
}
