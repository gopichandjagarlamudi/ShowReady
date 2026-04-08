import "server-only"

import { randomUUID } from "node:crypto"
import {
  canCreateLeadFromDraft,
  getDefaultTemplateForIntakeType,
  getQuestionLabel,
  intakeTypeToIntent,
  intentToIntakeType,
  type AgentProfile,
  type AgentSettings,
  type CustomQuestion,
  type IntakeDraft,
  type IntakeSubmission,
  type IntakeType,
  type Invite,
  type Lead,
  type LeadStage,
  type QuestionTemplate,
  type Recommendation,
  type ScoreOverride,
  type ScoreBreakdown
} from "@showready/types"
import { scoreLead } from "@showready/scoring"
import type { SupabaseClient, User } from "@supabase/supabase-js"
import type { Database, Json } from "./database"
import {
  assertLeadIntakeMutable,
  assertRequiredAnswerValue
} from "@/lib/intake-guards"
import {
  assertDraftSubmissionComplete,
  buildLeadInputFromDraft,
  flattenDraftAnswers
} from "@/lib/intake-draft"
import {
  getCoreQuestionsForIntakeType,
  getOptionalQuestionsForIntent,
  getRequiredQuestionsForIntent,
  resolveTemplateForIntakeType
} from "@/lib/intake-config"

type AppSupabaseClient = SupabaseClient<Database>

type OnboardingInput = {
  intakeType: IntakeType
  fullName: string
  brokerage?: string
  licenseNumber?: string
  brandName: string
  brandColor: string
  accentColor: string
  showThreshold: number
  notificationPreference: AgentSettings["notificationPreference"]
  introHeadline: string
  introBody: string
  customQuestions: CustomQuestion[]
}

type CreateLeadInput = {
  intakeType: IntakeType
  buyerName: string
  buyerPhone?: string
  buyerEmail?: string
}

type SubmitInviteInput = {
  draft: IntakeDraft
}

function nowIso() {
  return new Date().toISOString()
}

function requireData<T>(value: T | null, message: string): T {
  if (!value) {
    throw new Error(message)
  }

  return value
}

function getDisplayName(user: User) {
  const fromMetadata =
    typeof user.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata.name === "string"
        ? user.user_metadata.name
        : null

  return fromMetadata ?? user.email?.split("@")[0] ?? "ShowReady Agent"
}

function defaultSettings(agentId: string, templateId: string): Database["public"]["Tables"]["agent_settings"]["Insert"] {
  return {
    agent_id: agentId,
    brand_name: "ShowReady",
    brand_color: "#0F766E",
    accent_color: "#A16207",
    show_threshold: 8,
    notification_preference: "email",
    question_template_id: templateId
  }
}

function normalizeIntakeType(value: string | null | undefined): IntakeType {
  return value === "rental" ? "rental" : "sale"
}

function recommendationToStage(recommendation: Recommendation): LeadStage {
  if (recommendation === "show") {
    return "ready"
  }

  return recommendation
}

function recommendationForScore(
  score: number,
  showThreshold: number
): Recommendation {
  if (score >= showThreshold) {
    return "show"
  }

  if (score >= 5) {
    return "nurture"
  }

  return "hold"
}

function parseCustomQuestions(value: Json): CustomQuestion[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value as unknown as CustomQuestion[]
}

function parseBreakdown(value: Json | null): ScoreBreakdown | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined
  }

  return value as unknown as ScoreBreakdown
}

function parseDraft(value: Json | null): IntakeDraft | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined
  }

  return value as unknown as IntakeDraft
}

function buildAnswerMaps(
  rows: Database["public"]["Tables"]["lead_answers"]["Row"][],
  row?: Database["public"]["Tables"]["leads"]["Row"]
): {
  answers: IntakeDraft
  customAnswers: Record<string, string | string[]>
} {
  const answers: IntakeDraft = {
    contact: {
      fullName: row?.buyer_name ?? "",
      phone: row?.buyer_phone ?? undefined,
      email: row?.buyer_email ?? undefined
    },
    intent: row ? intakeTypeToIntent(normalizeIntakeType(row.intake_type)) : undefined,
    buyer: {},
    rental: {},
    customAnswers: {}
  }
  const customAnswers: Record<string, string | string[]> = answers.customAnswers ?? {}

  for (const row of rows) {
    if (row.question_key.startsWith("contact.")) {
      const key = row.question_key.replace("contact.", "")
      ;(answers.contact as Record<string, Json>)[key] = row.answer_value
      continue
    }

    if (row.question_key === "intent") {
      answers.intent = row.answer_value as "buy" | "rent"
      continue
    }

    if (row.question_key.startsWith("buyer.")) {
      const key = row.question_key.replace("buyer.", "")
      ;(answers.buyer as Record<string, Json>)[key] = row.answer_value
      continue
    }

    if (row.question_key.startsWith("rental.")) {
      const key = row.question_key.replace("rental.", "")
      ;(answers.rental as Record<string, Json>)[key] = row.answer_value
      continue
    }

    if (row.question_key.startsWith("custom.")) {
      customAnswers[row.question_key.replace("custom.", "")] =
        row.answer_value as string | string[]
    }
  }

  return {
    answers,
    customAnswers
  }
}

function mapAgentProfile(
  row: Database["public"]["Tables"]["agents"]["Row"]
): AgentProfile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    brokerage: row.brokerage ?? undefined,
    licenseNumber: row.license_number ?? undefined,
    photoUrl: row.photo_url ?? undefined,
    logoUrl: row.logo_url ?? undefined,
    onboardedAt: row.onboarded_at ?? undefined
  }
}

function mapAgentSettings(
  row: Database["public"]["Tables"]["agent_settings"]["Row"]
): AgentSettings {
  return {
    agentId: row.agent_id,
    brandName: row.brand_name,
    brandColor: row.brand_color,
    accentColor: row.accent_color,
    showThreshold: row.show_threshold,
    notificationPreference: row.notification_preference,
    questionTemplateId: row.question_template_id
  }
}

function mapQuestionTemplate(
  row: Database["public"]["Tables"]["question_templates"]["Row"]
): QuestionTemplate {
  return {
    id: row.id,
    intakeType: normalizeIntakeType(row.intake_type),
    name: row.name,
    introHeadline: row.intro_headline,
    introBody: row.intro_body,
    customQuestions: parseCustomQuestions(row.custom_questions)
  }
}

function mapLead(
  row: Database["public"]["Tables"]["leads"]["Row"],
  answerRows: Database["public"]["Tables"]["lead_answers"]["Row"][] = [],
  scoreRow?: Database["public"]["Tables"]["lead_scores"]["Row"]
): Lead {
  const { answers, customAnswers } = buildAnswerMaps(answerRows, row)
  const scoreOverride =
    scoreRow?.overridden && scoreRow.override_meta
      ? (scoreRow.override_meta as unknown as ScoreOverride)
      : undefined

  return {
    id: row.id,
    agentId: row.agent_id,
    intakeType: normalizeIntakeType(row.intake_type),
    buyerName: row.buyer_name,
    buyerPhone: row.buyer_phone ?? undefined,
    buyerEmail: row.buyer_email ?? undefined,
    token: row.token,
    tokenExpiresAt: row.token_expires_at,
    status: row.status,
    pipelineStage: row.pipeline_stage,
    submittedAt: row.submitted_at ?? undefined,
    score: row.score ?? undefined,
    recommendation: row.recommendation ?? undefined,
    summary: row.summary ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    answers,
    customAnswers,
    scoreBreakdown: parseBreakdown(scoreRow?.breakdown ?? null),
    scoreOverride
  }
}

function mapInvite(
  row: Database["public"]["Tables"]["invites"]["Row"]
): Invite {
  return {
    id: row.id,
    agentId: row.agent_id,
    token: row.token,
    status: row.status,
    tokenExpiresAt: row.token_expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    openedAt: row.opened_at ?? undefined,
    convertedAt: row.converted_at ?? undefined,
    leadId: row.lead_id ?? undefined,
    draft: parseDraft(row.draft_payload) ?? {
      contact: {
        fullName: ""
      }
    }
  }
}

export async function ensureAgentScaffold(
  adminClient: AppSupabaseClient,
  user: User
) {
  const { data: existingAgent } = await adminClient
    .from("agents")
    .select("id")
    .eq("id", user.id)
    .maybeSingle()

  if (existingAgent) {
    return
  }

  const fullName = getDisplayName(user)

  const { error: agentError } = await adminClient.from("agents").upsert(
    {
      id: user.id,
      email: user.email ?? `${user.id}@showready.local`,
      full_name: fullName
    },
    {
      onConflict: "id"
    }
  )

  if (agentError) {
    throw agentError
  }

  const templates = (["sale", "rental"] as const).map((intakeType) => {
    const template = getDefaultTemplateForIntakeType(intakeType)

    return {
      id: randomUUID(),
      agent_id: user.id,
      intake_type: intakeType,
      name: template.name,
      intro_headline: template.introHeadline,
      intro_body: template.introBody,
      custom_questions: template.customQuestions as unknown as Json
    }
  })

  const saleTemplateId =
    templates.find((entry) => entry.intake_type === "sale")?.id ?? randomUUID()

  const { error: templateError } = await adminClient
    .from("question_templates")
    .upsert(templates, {
      onConflict: "agent_id,intake_type"
    })

  if (templateError) {
    throw templateError
  }

  const { error: settingsError } = await adminClient
    .from("agent_settings")
    .insert({
      id: randomUUID(),
      ...defaultSettings(user.id, saleTemplateId)
    })

  if (
    settingsError &&
    settingsError.code !== "23505"
  ) {
    throw settingsError
  }
}

export async function getAgentContext(
  client: AppSupabaseClient,
  agentId: string
) {
  const [{ data: agent, error: agentError }, { data: settings, error: settingsError }] =
    await Promise.all([
      client.from("agents").select("*").eq("id", agentId).maybeSingle(),
      client
        .from("agent_settings")
        .select("*")
        .eq("agent_id", agentId)
        .maybeSingle()
    ])

  if (agentError) {
    throw agentError
  }

  if (settingsError) {
    throw settingsError
  }

  if (!agent || !settings) {
    return null
  }

  const { data: templates, error: templateError } = await client
    .from("question_templates")
    .select("*")
    .eq("agent_id", agentId)

  if (templateError) {
    throw templateError
  }

  if (!templates || templates.length === 0) {
    return null
  }

  const mappedTemplates = templates.map((entry) => mapQuestionTemplate(entry))
  const selectedTemplate =
    mappedTemplates.find((entry) => entry.id === settings.question_template_id) ??
    resolveTemplateForIntakeType("sale", mappedTemplates)

  return {
    agent: mapAgentProfile(agent),
    settings: mapAgentSettings(settings),
    template: selectedTemplate,
    templates: mappedTemplates
  }
}

export async function listLeads(
  client: AppSupabaseClient,
  agentId: string
) {
  const { data, error } = await client
    .from("leads")
    .select("*")
    .eq("agent_id", agentId)
    .order("updated_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapLead(row))
}

export async function listInvites(
  client: AppSupabaseClient,
  agentId: string
) {
  const { data, error } = await client
    .from("invites")
    .select("*")
    .eq("agent_id", agentId)
    .order("updated_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapInvite(row))
}

export async function createInvite(
  client: AppSupabaseClient,
  agentId: string
) {
  const { data, error } = await client
    .from("invites")
    .insert({
      agent_id: agentId,
      token: randomUUID(),
      status: "generated",
      token_expires_at: new Date(
        Date.now() + 1000 * 60 * 60 * 24 * 7
      ).toISOString(),
      draft_payload: {
        contact: {
          fullName: ""
        }
      } as unknown as Json,
      updated_at: nowIso()
    })
    .select("*")
    .single()

  if (error) {
    throw error
  }

  return mapInvite(data)
}

export async function getLeadById(
  client: AppSupabaseClient,
  agentId: string,
  leadId: string
) {
  const { data: lead, error: leadError } = await client
    .from("leads")
    .select("*")
    .eq("agent_id", agentId)
    .eq("id", leadId)
    .maybeSingle()

  if (leadError) {
    throw leadError
  }

  if (!lead) {
    return null
  }

  const [{ data: answerRows, error: answerError }, { data: scoreRows, error: scoreError }] =
    await Promise.all([
      client
        .from("lead_answers")
        .select("*")
        .eq("lead_id", leadId)
        .order("updated_at", { ascending: true }),
      client
        .from("lead_scores")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false })
        .limit(1)
    ])

  if (answerError) {
    throw answerError
  }

  if (scoreError) {
    throw scoreError
  }

  return mapLead(lead, answerRows ?? [], scoreRows?.[0])
}

export async function createLead(
  client: AppSupabaseClient,
  agentId: string,
  input: CreateLeadInput
) {
  if (!input.buyerEmail && !input.buyerPhone) {
    throw new Error("Add at least one contact method before creating a lead.")
  }

  const { data, error } = await client
    .from("leads")
    .insert({
      agent_id: agentId,
      buyer_name: input.buyerName,
      buyer_email: input.buyerEmail || null,
      buyer_phone: input.buyerPhone || null,
      intake_type: input.intakeType,
      token: randomUUID(),
      token_expires_at: new Date(
        Date.now() + 1000 * 60 * 60 * 24 * 7
      ).toISOString(),
      status: "pending",
      pipeline_stage: "new",
      updated_at: nowIso()
    })
    .select("*")
    .single()

  if (error) {
    throw error
  }

  return mapLead(data)
}

export async function completeOnboarding(
  client: AppSupabaseClient,
  agentId: string,
  input: OnboardingInput
) {
  if (input.customQuestions.length > 2) {
    throw new Error("Phase 1 only allows up to two custom context questions.")
  }

  const [{ data: settings, error: settingsError }, { data: templates, error: templateLookupError }] =
    await Promise.all([
      client
        .from("agent_settings")
        .select("*")
        .eq("agent_id", agentId)
        .single(),
      client
        .from("question_templates")
        .select("*")
        .eq("agent_id", agentId)
    ])

  if (settingsError) {
    throw settingsError
  }

  if (templateLookupError) {
    throw templateLookupError
  }

  const timestamp = nowIso()
  const template = resolveTemplateForIntakeType(
    input.intakeType,
    (templates ?? []).map((entry) => mapQuestionTemplate(entry))
  )

  const { error: agentError } = await client
    .from("agents")
    .update({
      full_name: input.fullName,
      brokerage: input.brokerage || null,
      license_number: input.licenseNumber || null,
      onboarded_at: timestamp
    })
    .eq("id", agentId)

  if (agentError) {
    throw agentError
  }

  const { error: settingUpdateError } = await client
    .from("agent_settings")
    .update({
      brand_name: input.brandName,
      brand_color: input.brandColor,
      accent_color: input.accentColor,
      show_threshold: input.showThreshold,
      notification_preference: input.notificationPreference
    })
    .eq("agent_id", agentId)

  if (settingUpdateError) {
    throw settingUpdateError
  }

  const { error: templateError } = await client
    .from("question_templates")
    .update({
      intro_headline: input.introHeadline,
      intro_body: input.introBody,
      custom_questions: input.customQuestions as unknown as Json
    })
    .eq("id", template.id)

  if (templateError) {
    throw templateError
  }
}

export async function updateLeadStage(
  client: AppSupabaseClient,
  agentId: string,
  leadId: string,
  pipelineStage: LeadStage
) {
  const { data, error } = await client
    .from("leads")
    .update({
      pipeline_stage: pipelineStage,
      updated_at: nowIso()
    })
    .eq("agent_id", agentId)
    .eq("id", leadId)
    .select("*")
    .single()

  if (error) {
    throw error
  }

  return mapLead(data)
}

export async function overrideLeadScore(
  client: AppSupabaseClient,
  agentId: string,
  leadId: string,
  overrideScore: number,
  note: string
) {
  const [leadContext, settingsContext, latestScoreContext, originalScoreContext] =
    await Promise.all([
      client
        .from("leads")
        .select("*")
        .eq("agent_id", agentId)
        .eq("id", leadId)
        .single(),
      client
        .from("agent_settings")
        .select("show_threshold")
        .eq("agent_id", agentId)
        .single(),
      client
        .from("lead_scores")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false })
        .limit(1),
      client
        .from("lead_scores")
        .select("*")
        .eq("lead_id", leadId)
        .eq("overridden", false)
        .order("created_at", { ascending: false })
        .limit(1)
    ])

  if (leadContext.error) {
    throw leadContext.error
  }

  if (settingsContext.error) {
    throw settingsContext.error
  }

  if (latestScoreContext.error) {
    throw latestScoreContext.error
  }

  if (originalScoreContext.error) {
    throw originalScoreContext.error
  }

  const lead = requireData(leadContext.data, "Lead not found.")
  const settings = requireData(settingsContext.data, "Agent settings not found.")
  const latestScore = latestScoreContext.data?.[0]
  const originalScore = originalScoreContext.data?.[0] ?? latestScore

  if (!lead.recommendation || typeof lead.score !== "number") {
    throw new Error("Scored lead not found.")
  }

  const overrideRecommendation = recommendationForScore(
    overrideScore,
    settings.show_threshold
  )
  const overrideMeta: ScoreOverride = {
    id: randomUUID(),
    originalScore: originalScore?.total ?? lead.score,
    originalRecommendation:
      originalScore?.recommendation ?? lead.recommendation,
    overrideScore,
    overrideRecommendation,
    note,
    createdAt: nowIso(),
    createdByAgentId: agentId
  }

  const { error: scoreInsertError } = await client.from("lead_scores").insert({
    lead_id: leadId,
    total: overrideScore,
    recommendation: overrideRecommendation,
    summary: `Manual override to ${overrideScore.toFixed(2)}. ${note}`,
    breakdown:
      latestScore?.breakdown ??
      ({} as unknown as Json),
    overridden: true,
    override_meta: overrideMeta as unknown as Json
  })

  if (scoreInsertError) {
    throw scoreInsertError
  }

  const { data, error } = await client
    .from("leads")
    .update({
      score: overrideScore,
      recommendation: overrideRecommendation,
      pipeline_stage: recommendationToStage(overrideRecommendation),
      summary: `Manual override to ${overrideScore.toFixed(2)}. ${note}`,
      updated_at: nowIso()
    })
    .eq("agent_id", agentId)
    .eq("id", leadId)
    .select("*")
    .single()

  if (error) {
    throw error
  }

  const { data: answerRows, error: answerError } = await client
    .from("lead_answers")
    .select("*")
    .eq("lead_id", leadId)
    .order("updated_at", { ascending: true })

  if (answerError) {
    throw answerError
  }

  return mapLead(
    data,
    answerRows ?? [],
    {
      id: overrideMeta.id,
      lead_id: leadId,
      total: overrideScore,
      recommendation: overrideRecommendation,
      summary: data.summary ?? "",
      breakdown: latestScore?.breakdown ?? ({} as Json),
      overridden: true,
      override_meta: overrideMeta as unknown as Json,
      created_at: overrideMeta.createdAt
    }
  )
}

export async function deleteLeads(
  client: AppSupabaseClient,
  agentId: string,
  leadIds: string[]
) {
  const uniqueLeadIds = Array.from(new Set(leadIds.filter(Boolean)))

  if (uniqueLeadIds.length === 0) {
    return 0
  }

  const { error: inviteDeleteError } = await client
    .from("invites")
    .delete()
    .eq("agent_id", agentId)
    .in("lead_id", uniqueLeadIds)

  if (inviteDeleteError) {
    throw inviteDeleteError
  }

  const { data, error } = await client
    .from("leads")
    .delete()
    .eq("agent_id", agentId)
    .in("id", uniqueLeadIds)
    .select("id")

  if (error) {
    throw error
  }

  return data?.length ?? 0
}

export async function getAnalyticsSummary(
  client: AppSupabaseClient,
  agentId: string
) {
  const { data, error } = await client
    .from("leads")
    .select("pipeline_stage, score")
    .eq("agent_id", agentId)

  if (error) {
    throw error
  }

  const leads = data ?? []
  const ready = leads.filter((lead) => lead.pipeline_stage === "ready").length
  const nurture = leads.filter((lead) => lead.pipeline_stage === "nurture").length
  const hold = leads.filter((lead) => lead.pipeline_stage === "hold").length
  const scored = leads.filter((lead) => typeof lead.score === "number")
  const averageScore =
    scored.reduce((sum, lead) => sum + (lead.score ?? 0), 0) /
    Math.max(scored.length, 1)

  return {
    totalLeads: leads.length,
    ready,
    nurture,
    hold,
    averageScore: Number.parseFloat(averageScore.toFixed(2))
  }
}

export async function getLeadIntakeContext(
  client: AppSupabaseClient,
  token: string
) {
  const { data: invite, error: inviteError } = await client
    .from("invites")
    .select("*")
    .eq("token", token)
    .maybeSingle()

  if (inviteError) {
    throw inviteError
  }

  if (!invite) {
    return null
  }

  const [
    { data: agent, error: agentError },
    { data: settings, error: settingsError },
    { data: templates, error: templateError },
    leadContext
  ] =
    await Promise.all([
      client.from("agents").select("*").eq("id", invite.agent_id).single(),
      client.from("agent_settings").select("*").eq("agent_id", invite.agent_id).single(),
      client.from("question_templates").select("*").eq("agent_id", invite.agent_id),
      invite.lead_id
        ? client.from("leads").select("*").eq("id", invite.lead_id).maybeSingle()
        : Promise.resolve({ data: null, error: null })
    ])

  if (agentError) {
    throw agentError
  }

  if (settingsError) {
    throw settingsError
  }

  if (templateError) {
    throw templateError
  }

  if (leadContext.error) {
    throw leadContext.error
  }

  let lead: Lead | undefined

  if (invite.lead_id && leadContext.data) {
    const [{ data: answerRows, error: answerError }, latestScore] = await Promise.all([
      client
        .from("lead_answers")
        .select("*")
        .eq("lead_id", invite.lead_id)
        .order("updated_at", { ascending: true }),
      client
        .from("lead_scores")
        .select("*")
        .eq("lead_id", invite.lead_id)
        .order("created_at", { ascending: false })
        .limit(1)
    ])

    if (answerError) {
      throw answerError
    }

    if (latestScore.error) {
      throw latestScore.error
    }

    lead = mapLead(leadContext.data, answerRows ?? [], latestScore.data?.[0])
  }

  const mappedTemplates = (templates ?? []).map((entry) => mapQuestionTemplate(entry))
  const parsedDraft = parseDraft(invite.draft_payload) ?? {
    contact: {
      fullName: ""
    }
  }
  const draftIntent = parsedDraft.intent ?? (lead ? intakeTypeToIntent(lead.intakeType) : undefined)

  return {
    invite: mapInvite(invite),
    lead,
    draft: parsedDraft,
    agent: mapAgentProfile(agent),
    settings: mapAgentSettings(settings),
    templates: {
      sale: resolveTemplateForIntakeType("sale", mappedTemplates),
      rental: resolveTemplateForIntakeType("rental", mappedTemplates)
    },
    isExpired: new Date(invite.token_expires_at).getTime() < Date.now(),
    questions: draftIntent
      ? {
          required: getRequiredQuestionsForIntent(intentToIntakeType(draftIntent)),
          optional: getOptionalQuestionsForIntent(intentToIntakeType(draftIntent))
        }
      : {
          required: [],
          optional: []
        }
  }
}

async function upsertLeadAnswersFromDraft(
  client: AppSupabaseClient,
  leadId: string,
  draft: IntakeDraft
) {
  const flattened = flattenDraftAnswers(draft)
  const answerUpserts = Object.entries(flattened).map(([questionKey, answerValue]) => ({
    lead_id: leadId,
    question_key: questionKey,
    answer_value: answerValue as Json,
    scored:
      questionKey.startsWith("buyer.") || questionKey.startsWith("rental."),
    updated_at: nowIso()
  }))

  if (answerUpserts.length === 0) {
    return
  }

  const { error } = await client.from("lead_answers").upsert(answerUpserts, {
    onConflict: "lead_id,question_key"
  })

  if (error) {
    throw error
  }
}

async function ensureLeadForInvite(
  client: AppSupabaseClient,
  inviteRow: Database["public"]["Tables"]["invites"]["Row"],
  draft: IntakeDraft
) {
  if (inviteRow.lead_id) {
    return inviteRow.lead_id
  }

  if (!canCreateLeadFromDraft(draft)) {
    return undefined
  }

  const leadInput = buildLeadInputFromDraft(draft)
  const { data: lead, error: leadError } = await client
    .from("leads")
    .insert({
      agent_id: inviteRow.agent_id,
      buyer_name: leadInput.buyerName,
      buyer_email: leadInput.buyerEmail ?? null,
      buyer_phone: leadInput.buyerPhone ?? null,
      intake_type: leadInput.intakeType,
      token: inviteRow.token,
      token_expires_at: inviteRow.token_expires_at,
      status: "pending",
      pipeline_stage: "new",
      updated_at: nowIso()
    })
    .select("id")
    .single()

  if (leadError) {
    throw leadError
  }

  const { error: inviteError } = await client
    .from("invites")
    .update({
      lead_id: lead.id,
      status: "converted",
      converted_at: nowIso(),
      updated_at: nowIso()
    })
    .eq("id", inviteRow.id)

  if (inviteError) {
    throw inviteError
  }

  return lead.id
}

export async function autosaveInviteDraft(
  client: AppSupabaseClient,
  token: string,
  draft: IntakeDraft
) {
  const { data: invite, error: inviteError } = await client
    .from("invites")
    .select("*")
    .eq("token", token)
    .maybeSingle()

  if (inviteError) {
    throw inviteError
  }

  if (!invite) {
    throw new Error("Invite not found.")
  }

  if (new Date(invite.token_expires_at).getTime() < Date.now()) {
    throw new Error("This intake link has expired.")
  }

  const leadId = await ensureLeadForInvite(client, invite, draft)

  if (leadId) {
    const { data: lead, error: leadError } = await client
      .from("leads")
      .select("status")
      .eq("id", leadId)
      .single()

    if (leadError) {
      throw leadError
    }

    assertLeadIntakeMutable(lead.status)
  }

  const { error: inviteUpdateError } = await client
    .from("invites")
    .update({
      draft_payload: draft as unknown as Json,
      status: leadId ? "converted" : "opened",
      opened_at: invite.opened_at ?? nowIso(),
      updated_at: nowIso()
    })
    .eq("id", invite.id)

  if (inviteUpdateError) {
    throw inviteUpdateError
  }

  if (leadId) {
    const leadInput = buildLeadInputFromDraft(draft)
    const { error: leadUpdateError } = await client
      .from("leads")
      .update({
        buyer_name: leadInput.buyerName,
        buyer_email: leadInput.buyerEmail ?? null,
        buyer_phone: leadInput.buyerPhone ?? null,
        intake_type: leadInput.intakeType,
        updated_at: nowIso()
      })
      .eq("id", leadId)

    if (leadUpdateError) {
      throw leadUpdateError
    }

    await upsertLeadAnswersFromDraft(client, leadId, draft)
  }
}

export async function submitInvite(
  client: AppSupabaseClient,
  token: string,
  input: SubmitInviteInput
) {
  const context = await getLeadIntakeContext(client, token)

  if (!context) {
    throw new Error("Invite not found.")
  }

  if (context.isExpired) {
    throw new Error("This intake link has expired.")
  }

  assertDraftSubmissionComplete(input.draft)
  await autosaveInviteDraft(client, token, input.draft)

  const refreshed = await getLeadIntakeContext(client, token)
  if (!refreshed?.lead) {
    throw new Error("Lead not found.")
  }

  assertLeadIntakeMutable(refreshed.lead.status)
  const submission = input.draft as IntakeSubmission
  const scored = scoreLead(submission, refreshed.settings.showThreshold)
  const persistedSummary = `${scored.summary} ${scored.nextAction}`.trim()

  await upsertLeadAnswersFromDraft(client, refreshed.lead.id, input.draft)

  const { error: scoreError } = await client.from("lead_scores").insert({
    lead_id: refreshed.lead.id,
    total: scored.total,
    recommendation: scored.recommendation,
    summary: persistedSummary,
    breakdown: scored.breakdown as unknown as Json,
    overridden: false
  })

  if (scoreError) {
    throw scoreError
  }

  const { data: lead, error: leadError } = await client
    .from("leads")
    .update({
      status: "submitted",
      pipeline_stage: recommendationToStage(scored.recommendation),
      score: scored.total,
      recommendation: scored.recommendation,
      summary: persistedSummary,
      submitted_at: nowIso(),
      updated_at: nowIso()
    })
    .eq("id", refreshed.lead.id)
    .select("*")
    .single()

  if (leadError) {
    throw leadError
  }

  const { data: answerRows, error: answerRowsError } = await client
    .from("lead_answers")
    .select("*")
    .eq("lead_id", refreshed.lead.id)
    .order("updated_at", { ascending: true })

  if (answerRowsError) {
    throw answerRowsError
  }

  return {
    lead: mapLead(
      lead,
      answerRows ?? [],
      {
        id: randomUUID(),
        lead_id: refreshed.lead.id,
        total: scored.total,
        recommendation: scored.recommendation,
        summary: persistedSummary,
        breakdown: scored.breakdown as unknown as Json,
        overridden: false,
        override_meta: null,
        created_at: nowIso()
      }
    ),
    settings: refreshed.settings
  }
}
