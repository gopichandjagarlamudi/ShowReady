import { createClient } from "@supabase/supabase-js"
import { scoreLead } from "@showready/scoring"
import {
  getDefaultTemplateForIntakeType,
  type IntakeSubmission,
  type IntakeType
} from "@showready/types"
import type { Database } from "../lib/supabase/database"
import { flattenDraftAnswers } from "../lib/intake-draft"

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
  submission: IntakeSubmission
}> = [
  {
    id: "e357e934-6f9a-4d75-bf12-8db0cd1bf701",
    token: "87cb75ad-a9c7-4bd2-b4af-b0c5dcb63af1",
    scoreId: "e7a8e991-1c7a-41b1-b1a3-7e2197ef1f41",
    buyerName: "Sofia Chen",
    buyerEmail: "sofia.chen@example.com",
    buyerPhone: "+1 416 555 0101",
    intakeType: "sale",
    submission: {
      contact: {
        fullName: "Sofia Chen",
        email: "sofia.chen@example.com",
        phone: "+1 416 555 0101"
      },
      intent: "buy",
      buyer: {
        buyingFor: "myself",
        timeline: "asap",
        budgetKnowledge: "know_it",
        mortgageStatus: "cash",
        neighborhoods: "Leaside, Lawrence Park",
        propertyType: "detached",
        bedrooms: "4",
        bathrooms: "3",
        mustHaves: ["backyard", "parking"],
        workedWithAnotherRealtor: "no",
        additionalContext: "Flying in next week and ready to shortlist properties immediately."
      }
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
    submission: {
      contact: {
        fullName: "Marcus Hall",
        email: "marcus.hall@example.com",
        phone: "+1 647 555 0199"
      },
      intent: "rent",
      rental: {
        moveTimeline: "within_1_month",
        rentRange: "$2,000–$2,500/mo",
        neighborhoods: "North York",
        placeType: "apartment",
        bedrooms: "2",
        hasPets: "no",
        occupantCount: "3",
        incomeProof: "yes",
        preferredMoveInDate: "2026-05-01",
        mustHaves: ["laundry", "near_transit"],
        rentedInCanadaBefore: "yes",
        additionalContext: "Needs a larger place before the next school year starts."
      }
    }
  },
  {
    id: "da26711a-69dd-4ce2-ab48-8efcf9811f14",
    token: "280d3aa9-8b2b-4e8f-813d-b72d2e3af082",
    scoreId: "c8526f41-53d7-4b4e-8689-b337322dbb09",
    buyerName: "Nina Patel",
    buyerEmail: "nina.patel@example.com",
    intakeType: "sale",
    submission: {
      contact: {
        fullName: "Nina Patel",
        email: "nina.patel@example.com"
      },
      intent: "buy",
      buyer: {
        buyingFor: "not_sure",
        timeline: "exploring",
        budgetKnowledge: "not_yet",
        mortgageStatus: "not_yet",
        neighborhoods: "Still deciding",
        propertyType: "condo",
        workedWithAnotherRealtor: "yes",
        additionalContext: "Still comparing neighborhoods and not ready for showings yet."
      }
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
  await client
    .from("leads")
    .delete()
    .in("token", [
      "37d16df0-9200-46be-9f51-cf9213d61b23",
      "d4487e1f-498c-4f2c-99fd-3b63e723f364"
    ])

  for (const spec of sampleLeadSpecs) {
    const scored = scoreLead(spec.submission, 8)
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
          scored.recommendation === "show" ? "ready_to_show" : scored.recommendation,
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

    const answerRows = Object.entries(
      flattenDraftAnswers({
        contact: spec.submission.contact,
        intent: spec.submission.intent,
        buyer: spec.submission.intent === "buy" ? spec.submission.buyer : undefined,
        rental: spec.submission.intent === "rent" ? spec.submission.rental : undefined,
        customAnswers: spec.submission.customAnswers ?? {}
      })
    ).map(([questionKey, answerValue]) => ({
      lead_id: spec.id,
      question_key: questionKey,
      answer_value: answerValue as Database["public"]["Tables"]["lead_answers"]["Insert"]["answer_value"],
      scored: questionKey.startsWith("buyer.") || questionKey.startsWith("rental."),
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

    const { error: inviteError } = await client.from("invites").upsert(
      {
        id: spec.id,
        agent_id: agentId,
        token: spec.token,
        status: "converted",
        token_expires_at: "2099-01-01T00:00:00.000Z",
        draft_payload: {
          contact: spec.submission.contact,
          intent: spec.submission.intent,
          buyer: spec.submission.intent === "buy" ? spec.submission.buyer : undefined,
          rental: spec.submission.intent === "rent" ? spec.submission.rental : undefined,
          customAnswers: spec.submission.customAnswers ?? {}
        },
        lead_id: spec.id,
        opened_at: now,
        converted_at: now,
        updated_at: now
      },
      {
        onConflict: "id"
      }
    )

    if (inviteError) {
      throw inviteError
    }
  }

  await client.from("invites").upsert(
    [
      {
        id: "7f0f52ca-6c8f-40fd-9f49-7a7a6ce19193",
        agent_id: agentId,
        token: "37d16df0-9200-46be-9f51-cf9213d61b23",
        status: "generated",
        token_expires_at: "2099-01-01T00:00:00.000Z",
        lead_id: null,
        opened_at: null,
        converted_at: null,
        draft_payload: {
          contact: {
            fullName: ""
          }
        }
      },
      {
        id: "db153f0a-ddda-4d93-a2c7-c0a7fd0e4b45",
        agent_id: agentId,
        token: "d4487e1f-498c-4f2c-99fd-3b63e723f364",
        status: "generated",
        token_expires_at: "2099-01-01T00:00:00.000Z",
        lead_id: null,
        opened_at: null,
        converted_at: null,
        draft_payload: {
          contact: {
            fullName: ""
          }
        }
      }
    ],
    {
      onConflict: "id"
    }
  )
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
