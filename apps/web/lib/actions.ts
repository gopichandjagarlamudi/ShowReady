"use server";

import {
  completeOnboarding,
  createAppointment,
  createInvite,
  deleteLeads,
  ensureAgentScaffold,
  overrideLeadScore,
  reviewLead,
  updateAppointment,
  updateAppointmentStatus,
  updateLeadStage
} from "@/lib/supabase/data"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getCurrentAgentContext, getCurrentAgentId } from "./session"
import { trackServerEvent } from "./analytics"
import { buildAppUrl } from "./utils"
import type { AppointmentStatus } from "@showready/types"

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

function parseShowings(formData: FormData) {
  const addresses = formData.getAll("showingAddress").map((value) => String(value ?? ""))
  const notes = formData.getAll("showingNotes").map((value) => String(value ?? ""))

  return addresses.map((address, index) => ({
    address,
    notes: notes[index]
  }))
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

export async function createInviteAction() {
  const agentId = await getCurrentAgentId()
  if (!agentId) {
    redirect("/login")
  }

  const supabase = await createSupabaseServerClient()

  try {
    const invite = await createInvite(supabase, agentId)

    await trackServerEvent(
      "invite.created",
      {},
      agentId
    )

    revalidatePath("/dashboard")
    revalidatePath("/leads")
    redirect(`/dashboard?invite=${invite.token}`)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create the invite."
    redirect(`/dashboard?error=${encodeURIComponent(message)}`)
  }
}

export async function saveAppointmentAction(formData: FormData) {
  const agentId = await getCurrentAgentId()
  if (!agentId) {
    redirect("/login")
  }

  const supabase = await createSupabaseServerClient()
  const appointmentId = getString(formData, "appointmentId")
  const leadId = getString(formData, "leadId")
  const date = getString(formData, "date")
  const startTime = getString(formData, "startTime")
  const notes = getString(formData, "notes")
  const showings = parseShowings(formData)

  if (appointmentId) {
    await updateAppointment(supabase, agentId, appointmentId, {
      date,
      startTime,
      notes,
      showings
    })
    await trackServerEvent("appointment.updated", { appointmentId }, agentId)
  } else {
    await createAppointment(supabase, agentId, {
      leadId,
      date,
      startTime,
      notes,
      showings
    })
    await trackServerEvent("appointment.created", { leadId }, agentId)
  }

  revalidatePath("/appointments")
  revalidatePath(`/leads/${leadId}`)
  revalidatePath("/leads")
  revalidatePath("/dashboard")
}

export async function updateAppointmentStatusAction(formData: FormData) {
  const agentId = await getCurrentAgentId()
  if (!agentId) {
    redirect("/login")
  }

  const appointmentId = getString(formData, "appointmentId")
  const leadId = getString(formData, "leadId")
  const status = getString(formData, "status") as AppointmentStatus
  const supabase = await createSupabaseServerClient()

  await updateAppointmentStatus(supabase, agentId, appointmentId, status)
  await trackServerEvent("appointment.status_changed", { appointmentId, status }, agentId)

  revalidatePath("/appointments")
  revalidatePath(`/leads/${leadId}`)
  revalidatePath("/leads")
  revalidatePath("/dashboard")
}

export async function updateLeadStageAction(formData: FormData) {
  const agentId = await getCurrentAgentId()
  if (!agentId) {
    redirect("/login")
  }

  const leadId = getString(formData, "leadId")
  const pipelineStage = getString(formData, "pipelineStage") as
    | "ready_to_show"
    | "nurture"
    | "hold"
    | "closed_won"
    | "closed_lost"
    | "archived"

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
  revalidatePath("/new-leads")
  revalidatePath("/appointments")
}

export async function reviewLeadAction(formData: FormData) {
  const agentId = await getCurrentAgentId()
  if (!agentId) {
    redirect("/login")
  }

  const leadId = getString(formData, "leadId")
  const pipelineStage = getString(formData, "pipelineStage") as
    | "ready_to_show"
    | "nurture"
    | "hold"

  const supabase = await createSupabaseServerClient()
  await reviewLead(supabase, agentId, leadId, pipelineStage)
  await trackServerEvent(
    "lead.reviewed",
    {
      pipelineStage
    },
    agentId
  )

  revalidatePath(`/leads/${leadId}`)
  revalidatePath("/dashboard")
  revalidatePath("/leads")
  revalidatePath("/new-leads")
  revalidatePath("/appointments")
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
  revalidatePath("/new-leads")
  revalidatePath("/appointments")
}

export async function deleteLeadsAction(formData: FormData) {
  const agentId = await getCurrentAgentId()
  if (!agentId) {
    redirect("/login")
  }

  const leadIds = formData
    .getAll("leadId")
    .map((value) => String(value).trim())
    .filter(Boolean)

  if (leadIds.length === 0) {
    return
  }

  const supabase = await createSupabaseServerClient()
  const deletedCount = await deleteLeads(supabase, agentId, leadIds)

  await trackServerEvent(
    "lead.deleted",
    {
      deletedCount
    },
    agentId
  )

  revalidatePath("/dashboard")
  revalidatePath("/leads")
  revalidatePath("/new-leads")
  revalidatePath("/appointments")
}

export async function getDashboardContext() {
  return getCurrentAgentContext()
}
