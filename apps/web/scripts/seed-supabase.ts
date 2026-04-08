import { createClient } from "@supabase/supabase-js"
import { scoreLead } from "@showready/scoring"
import {
  getDefaultTemplateForIntakeType,
  type IntakeAnswers,
  type IntakeType
} from "@showready/types"
import type { Database } from "../lib/supabase/database"

const DEMO_EMAIL = "demo@showready.local"
const DEMO_PASSWORD = "demo12345"
const DEMO_AGENT_ID = "9c0b8ef5-1b2f-4b4c-8d6a-9b4e0f7d3c51"

const sampleLeadSpecs: Array<{
  id: string
  token: string
  scoreId: string
  buyerName: string
  buyerEmail: string
  buyerPhone?: string
  intakeType: IntakeType
  answers: IntakeAnswers
}> = [
  {
    id: "e357e934-6f9a-4d75-bf12-8db0cd1bf701",
    token: "87cb75ad-a9c7-4bd2-b4af-b0c5dcb63af1",
    scoreId: "e7a8e991-1c7a-41b1-b1a3-7e2197ef1f41",
    buyerName: "Sofia Chen",
    buyerEmail: "sofia.chen@example.com",
    buyerPhone: "+1 416 555 0101",
    intakeType: "sale",
    answers: {
      timeline: "asap",
      financing: "cash",
      budgetBand: "1m_plus",
      exclusiveAgent: "no",
      moveReasons: ["relocation"],
      priorShowings: "many",
      offerReadiness: 5,
      notes: "Flying in next week and ready to shortlist properties immediately."
    }
  },
  {
    id: "bd30eb53-5bc1-460d-95a2-13c2f7c5e2bb",
    token: "4cbca64a-4699-4cb4-81fd-d0ea6fcb8748",
    scoreId: "8caa8916-16b0-44ba-a4ee-c1de32eb6f1b",
    buyerName: "Marcus Hall",
    buyerEmail: "marcus.hall@example.com",
    buyerPhone: "+1 647 555 0199",
    intakeType: "rental",
    answers: {
      timeline: "3_6mo",
      financing: "in_progress",
      budgetBand: "400k_600k",
      exclusiveAgent: "yes_not_exclusive",
      moveReasons: ["upsizing"],
      priorShowings: "few",
      offerReadiness: 3,
      notes: "Needs a larger place before the next school year starts."
    }
  },
  {
    id: "da26711a-69dd-4ce2-ab48-8efcf9811f14",
    token: "280d3aa9-8b2b-4e8f-813d-b72d2e3af082",
    scoreId: "c8526f41-53d7-4b4e-8689-b337322dbb09",
    buyerName: "Nina Patel",
    buyerEmail: "nina.patel@example.com",
    intakeType: "sale",
    answers: {
      timeline: "exploring",
      financing: "no",
      budgetBand: "under_200k",
      exclusiveAgent: "yes_exclusive",
      moveReasons: ["lifestyle"],
      priorShowings: "none",
      offerReadiness: 1,
      notes: "Still comparing neighborhoods and not ready for showings yet."
    }
  }
]

function requireEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

async function getOrCreateDemoUser(client: ReturnType<typeof createClient<Database>>) {
  const { data: listed, error: listError } = await client.auth.admin.listUsers({
    page: 1,
    perPage: 200
  })

  if (listError) {
    throw listError
  }

  const existing = listed.users.find((user) => user.email === DEMO_EMAIL)
  if (existing) {
    const { data: updated, error: updateError } = await client.auth.admin.updateUserById(
      existing.id,
      {
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: "Demo Agent"
        }
      }
    )

    if (updateError) {
      throw updateError
    }

    if (updated.user.id !== DEMO_AGENT_ID) {
      console.warn(
        `Demo user already exists with id ${updated.user.id}; public seed data will follow that id.`
      )
    }

    return updated.user
  }

  const { data, error } = await client.auth.admin.createUser({
    id: DEMO_AGENT_ID,
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: "Demo Agent"
    }
  })

  if (error) {
    throw error
  }

  return data.user
}

async function seedAgentScaffold(
  client: ReturnType<typeof createClient<Database>>,
  agentId: string
) {
  const { data: existingTemplates, error: templateLookupError } = await client
    .from("question_templates")
    .select("id, intake_type")
    .eq("agent_id", agentId)

  if (templateLookupError) {
    throw templateLookupError
  }

  const saleTemplateId =
    existingTemplates?.find((entry) => entry.intake_type === "sale")?.id ?? "demo-sale-template"
  const rentalTemplateId =
    existingTemplates?.find((entry) => entry.intake_type === "rental")?.id ?? "demo-rental-template"

  const { error: agentError } = await client.from("agents").upsert(
    {
      id: agentId,
      email: DEMO_EMAIL,
      full_name: "Demo Agent",
      brokerage: "Northline Realty",
      license_number: "SR-2026-001",
      onboarded_at: new Date().toISOString()
    },
    {
      onConflict: "id"
    }
  )

  if (agentError) {
    throw agentError
  }

  const saleTemplate = getDefaultTemplateForIntakeType("sale")
  const rentalTemplate = getDefaultTemplateForIntakeType("rental")

  const { error: templateError } = await client.from("question_templates").upsert(
    [
      {
        id: saleTemplateId,
        agent_id: agentId,
        intake_type: "sale",
        name: saleTemplate.name,
        intro_headline: saleTemplate.introHeadline,
        intro_body: saleTemplate.introBody,
        custom_questions: [
          {
            id: "custom-1",
            label: "What neighborhoods are you focused on?",
            type: "text",
            required: false
          }
        ]
      },
      {
        id: rentalTemplateId,
        agent_id: agentId,
        intake_type: "rental",
        name: rentalTemplate.name,
        intro_headline: rentalTemplate.introHeadline,
        intro_body: rentalTemplate.introBody,
        custom_questions: [
          {
            id: "custom-1",
            label: "Which neighborhoods or buildings are at the top of your list?",
            type: "text",
            required: false
          }
        ]
      }
    ],
    {
      onConflict: "agent_id,intake_type"
    }
  )

  if (templateError) {
    throw templateError
  }

  const { error: settingsError } = await client.from("agent_settings").upsert(
    {
      agent_id: agentId,
      brand_name: "ShowReady Advisory",
      brand_color: "#0F766E",
      accent_color: "#A16207",
      show_threshold: 8,
      question_template_id: saleTemplateId,
      notification_preference: "email"
    },
    {
      onConflict: "agent_id"
    }
  )

  if (settingsError) {
    throw settingsError
  }
}

async function seedLeadData(
  client: ReturnType<typeof createClient<Database>>,
  agentId: string
) {
  for (const spec of sampleLeadSpecs) {
    const scored = scoreLead(spec.answers, 8)
    const now = new Date().toISOString()

    const { error: leadError } = await client.from("leads").upsert(
      {
        id: spec.id,
        agent_id: agentId,
        buyer_name: spec.buyerName,
        buyer_email: spec.buyerEmail,
        buyer_phone: spec.buyerPhone ?? null,
        intake_type: spec.intakeType,
        token: spec.token,
        token_expires_at: "2099-01-01T00:00:00.000Z",
        status: "submitted",
        pipeline_stage:
          scored.recommendation === "show" ? "ready" : scored.recommendation,
        score: scored.total,
        recommendation: scored.recommendation,
        summary: scored.summary,
        submitted_at: now,
        updated_at: now
      },
      {
        onConflict: "id"
      }
    )

    if (leadError) {
      throw leadError
    }

    const answerRows = Object.entries(spec.answers).map(([questionKey, answerValue]) => ({
      lead_id: spec.id,
      question_key: questionKey,
      answer_value: answerValue,
      scored: true,
      updated_at: now
    }))

    const { error: answersError } = await client.from("lead_answers").upsert(answerRows, {
      onConflict: "lead_id,question_key"
    })

    if (answersError) {
      throw answersError
    }

    const { error: scoreError } = await client.from("lead_scores").upsert(
      {
        id: spec.scoreId,
        lead_id: spec.id,
        total: scored.total,
        recommendation: scored.recommendation,
        summary: scored.summary,
        breakdown: scored.breakdown,
        overridden: false
      },
      {
        onConflict: "id"
      }
    )

    if (scoreError) {
      throw scoreError
    }
  }
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL")
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY")
  const client = createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const user = await getOrCreateDemoUser(client)
  await seedAgentScaffold(client, user.id)
  await seedLeadData(client, user.id)

  console.log(`Seeded Supabase demo data for ${DEMO_EMAIL} (${user.id}).`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
