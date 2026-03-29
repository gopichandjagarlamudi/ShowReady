import { scoreLead } from "@showready/scoring";
import {
  CORE_QUESTIONS,
  DEFAULT_TEMPLATE,
  type AgentProfile,
  type AgentSettings,
  type CustomQuestion,
  type IntakeAnswers,
  type Lead,
  type LeadStage,
  type MoveReason,
  type QuestionTemplate,
  type Recommendation,
  type ScoreOverride
} from "@showready/types";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type StoredAgent = AgentProfile & {
  passwordHash: string;
};

type AnalyticsEvent = {
  id: string;
  agentId?: string;
  name: string;
  metadata?: Record<string, string | number | boolean>;
  createdAt: string;
};

type MockState = {
  agents: StoredAgent[];
  agentSettings: AgentSettings[];
  questionTemplates: QuestionTemplate[];
  leads: Lead[];
  analyticsEvents: AnalyticsEvent[];
};

type RegisterInput = {
  email: string;
  fullName: string;
  password: string;
};

type OnboardingInput = {
  fullName: string;
  brokerage?: string;
  licenseNumber?: string;
  brandName: string;
  brandColor: string;
  accentColor: string;
  showThreshold: number;
  notificationPreference: AgentSettings["notificationPreference"];
  introHeadline: string;
  introBody: string;
  customQuestions: CustomQuestion[];
};

type CreateLeadInput = {
  buyerName: string;
  buyerPhone?: string;
  buyerEmail?: string;
};

type SubmitLeadInput = {
  answers: IntakeAnswers;
  customAnswers?: Record<string, string | string[]>;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDirectory = path.resolve(__dirname, "../../../.showready-data");
const dataFile = path.join(dataDirectory, "store.json");

const defaultSettings = (agentId: string, templateId = DEFAULT_TEMPLATE.id): AgentSettings => ({
  agentId,
  brandName: "ShowReady",
  brandColor: "#0F766E",
  accentColor: "#A16207",
  showThreshold: 8,
  notificationPreference: "email",
  questionTemplateId: templateId
});

const nowIso = () => new Date().toISOString();

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

function recommendationToStage(recommendation: Recommendation): LeadStage {
  if (recommendation === "show") {
    return "ready";
  }

  return recommendation;
}

function createTemplate(agentId: string, overrides?: Partial<QuestionTemplate>): QuestionTemplate {
  return {
    ...DEFAULT_TEMPLATE,
    id: overrides?.id ?? randomUUID(),
    customQuestions: overrides?.customQuestions ?? [],
    introHeadline: overrides?.introHeadline ?? DEFAULT_TEMPLATE.introHeadline,
    introBody: overrides?.introBody ?? DEFAULT_TEMPLATE.introBody,
    name: overrides?.name ?? DEFAULT_TEMPLATE.name,
    ...overrides,
    agentId
  } as QuestionTemplate & { agentId?: string };
}

function createScoredLead(
  agentId: string,
  input: CreateLeadInput,
  answers: IntakeAnswers
): Lead {
  const scored = scoreLead(answers, 8);
  const id = randomUUID();
  return {
    id,
    agentId,
    buyerName: input.buyerName,
    buyerEmail: input.buyerEmail,
    buyerPhone: input.buyerPhone,
    token: randomUUID(),
    tokenExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    status: "submitted",
    pipelineStage: recommendationToStage(scored.recommendation),
    submittedAt: nowIso(),
    score: scored.total,
    recommendation: scored.recommendation,
    summary: scored.summary,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    answers,
    customAnswers: {},
    scoreBreakdown: scored.breakdown
  };
}

function seedDemoState(): MockState {
  const demoAgentId = randomUUID();
  const templateId = randomUUID();
  const demoTemplate = createTemplate(demoAgentId, {
    id: templateId,
    introHeadline: "Before we tour homes, help me prepare properly",
    introBody:
      "These quick questions keep our search focused and save you from seeing homes that do not fit your timing."
  });

  const demoAgent: StoredAgent = {
    id: demoAgentId,
    email: "demo@showready.local",
    fullName: "Avery Sutton",
    brokerage: "Sutton & Co Realty",
    licenseNumber: "SR-4412",
    onboardedAt: nowIso(),
    passwordHash: hashPassword("demo12345")
  };

  const demoSettings: AgentSettings = {
    ...defaultSettings(demoAgentId, templateId),
    brandName: "Avery Sutton Homes",
    brandColor: "#0F766E",
    accentColor: "#A16207",
    notificationPreference: "email_and_push"
  };

  const leads = [
    createScoredLead(
      demoAgentId,
      {
        buyerName: "Jordan Wells",
        buyerEmail: "jordan@example.com"
      },
      {
        timeline: "asap",
        financing: "pre_approved",
        budgetBand: "800k_1m",
        exclusiveAgent: "no",
        moveReasons: ["relocation", "job_change"],
        priorShowings: "few",
        offerReadiness: 4,
        notes: "Needs space for a home office."
      }
    ),
    createScoredLead(
      demoAgentId,
      {
        buyerName: "Morgan Lee",
        buyerPhone: "+1 416 555 0118"
      },
      {
        timeline: "3_6mo",
        financing: "in_progress",
        budgetBand: "600k_800k",
        exclusiveAgent: "no",
        moveReasons: ["upsizing"],
        priorShowings: "few",
        offerReadiness: 3,
        notes: "Would like a detached home eventually."
      }
    ),
    createScoredLead(
      demoAgentId,
      {
        buyerName: "Taylor Adams",
        buyerEmail: "taylor@example.com"
      },
      {
        timeline: "exploring",
        financing: "no",
        budgetBand: "400k_600k",
        exclusiveAgent: "yes_exclusive",
        moveReasons: ["lifestyle"],
        priorShowings: "none",
        offerReadiness: 1,
        notes: "Mostly browsing neighborhoods."
      }
    )
  ];

  return {
    agents: [demoAgent],
    agentSettings: [demoSettings],
    questionTemplates: [demoTemplate],
    leads,
    analyticsEvents: []
  };
}

async function ensureState() {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(dataFile, "utf8");
  } catch {
    await writeFile(dataFile, JSON.stringify(seedDemoState(), null, 2), "utf8");
  }
}

async function readState(): Promise<MockState> {
  await ensureState();
  const raw = await readFile(dataFile, "utf8");
  return JSON.parse(raw) as MockState;
}

async function writeState(state: MockState) {
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(dataFile, JSON.stringify(state, null, 2), "utf8");
}

async function mutateState<T>(updater: (state: MockState) => T | Promise<T>) {
  const state = await readState();
  const result = await updater(state);
  await writeState(state);
  return result;
}

function sanitizeAgent(agent: StoredAgent): AgentProfile {
  const { passwordHash: _passwordHash, ...safeAgent } = agent;
  return safeAgent;
}

function requireTemplate(state: MockState, templateId: string) {
  const template = state.questionTemplates.find((entry) => entry.id === templateId);
  if (!template) {
    throw new Error("Question template not found.");
  }
  return template;
}

function ensureCustomQuestionLimit(customQuestions: CustomQuestion[]) {
  if (customQuestions.length > 2) {
    throw new Error("Phase 1 only allows up to two custom context questions.");
  }
}

export async function registerAgent(input: RegisterInput) {
  return mutateState((state) => {
    const existing = state.agents.find(
      (agent) => agent.email.toLowerCase() === input.email.toLowerCase()
    );
    if (existing) {
      throw new Error("An agent with that email already exists.");
    }

    const agentId = randomUUID();
    const templateId = randomUUID();
    const agent: StoredAgent = {
      id: agentId,
      email: input.email.toLowerCase(),
      fullName: input.fullName,
      passwordHash: hashPassword(input.password)
    };

    state.agents.push(agent);
    state.questionTemplates.push(
      createTemplate(agentId, {
        id: templateId,
        name: `${input.fullName.split(" ")[0]}'s Template`
      })
    );
    state.agentSettings.push(defaultSettings(agentId, templateId));

    return sanitizeAgent(agent);
  });
}

export async function authenticateAgent(email: string, password: string) {
  const state = await readState();
  const agent = state.agents.find(
    (entry) => entry.email.toLowerCase() === email.toLowerCase()
  );

  if (!agent || agent.passwordHash !== hashPassword(password)) {
    throw new Error("Invalid email or password.");
  }

  return sanitizeAgent(agent);
}

export async function getAgentContext(agentId: string) {
  const state = await readState();
  const agent = state.agents.find((entry) => entry.id === agentId);
  if (!agent) {
    return null;
  }

  const settings = state.agentSettings.find((entry) => entry.agentId === agentId);
  if (!settings) {
    return null;
  }

  const template = requireTemplate(state, settings.questionTemplateId);

  return {
    agent: sanitizeAgent(agent),
    settings,
    template
  };
}

export async function completeOnboarding(
  agentId: string,
  input: OnboardingInput
) {
  return mutateState((state) => {
    const agent = state.agents.find((entry) => entry.id === agentId);
    const settings = state.agentSettings.find((entry) => entry.agentId === agentId);

    if (!agent || !settings) {
      throw new Error("Agent not found.");
    }

    ensureCustomQuestionLimit(input.customQuestions);
    const template = requireTemplate(state, settings.questionTemplateId);

    agent.fullName = input.fullName;
    agent.brokerage = input.brokerage;
    agent.licenseNumber = input.licenseNumber;
    agent.onboardedAt = nowIso();

    settings.brandName = input.brandName;
    settings.brandColor = input.brandColor;
    settings.accentColor = input.accentColor;
    settings.showThreshold = input.showThreshold;
    settings.notificationPreference = input.notificationPreference;

    template.introHeadline = input.introHeadline;
    template.introBody = input.introBody;
    template.customQuestions = input.customQuestions;

    return {
      agent: sanitizeAgent(agent),
      settings,
      template
    };
  });
}

export async function listLeads(agentId: string) {
  const state = await readState();
  return state.leads
    .filter((lead) => lead.agentId === agentId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getLeadById(agentId: string, leadId: string) {
  const state = await readState();
  return (
    state.leads.find((lead) => lead.agentId === agentId && lead.id === leadId) ??
    null
  );
}

export async function createLead(agentId: string, input: CreateLeadInput) {
  return mutateState((state) => {
    const timestamp = nowIso();
    const lead: Lead = {
      id: randomUUID(),
      agentId,
      buyerName: input.buyerName,
      buyerPhone: input.buyerPhone,
      buyerEmail: input.buyerEmail,
      token: randomUUID(),
      tokenExpiresAt: new Date(
        Date.now() + 1000 * 60 * 60 * 24 * 7
      ).toISOString(),
      status: "pending",
      pipelineStage: "new",
      createdAt: timestamp,
      updatedAt: timestamp,
      answers: {},
      customAnswers: {}
    };

    state.leads.unshift(lead);
    return lead;
  });
}

export async function getLeadIntakeContext(token: string) {
  const state = await readState();
  const lead = state.leads.find((entry) => entry.token === token);

  if (!lead) {
    return null;
  }

  const settings = state.agentSettings.find((entry) => entry.agentId === lead.agentId);
  const agent = state.agents.find((entry) => entry.id === lead.agentId);

  if (!agent || !settings) {
    return null;
  }

  const template = requireTemplate(state, settings.questionTemplateId);

  return {
    lead,
    agent: sanitizeAgent(agent),
    settings,
    template,
    isExpired: new Date(lead.tokenExpiresAt).getTime() < Date.now(),
    questions: CORE_QUESTIONS
  };
}

export async function autosaveLeadAnswer(
  token: string,
  questionKey: string,
  value: string | string[] | number
) {
  return mutateState((state) => {
    const lead = state.leads.find((entry) => entry.token === token);
    if (!lead) {
      throw new Error("Lead not found.");
    }

    if (new Date(lead.tokenExpiresAt).getTime() < Date.now()) {
      throw new Error("This intake link has expired.");
    }

    if (CORE_QUESTIONS.some((question) => question.key === questionKey)) {
      lead.answers = {
        ...(lead.answers ?? {}),
        [questionKey]: value
      } as Partial<IntakeAnswers>;
    } else {
      lead.customAnswers = {
        ...(lead.customAnswers ?? {}),
        [questionKey]: value as string | string[]
      };
    }

    lead.updatedAt = nowIso();
    return lead;
  });
}

function assertCompleteAnswers(
  answers: Partial<IntakeAnswers>
): asserts answers is IntakeAnswers {
  const missing = CORE_QUESTIONS.filter(
    (question) => !answers[question.key as keyof IntakeAnswers]
  )
    .map((question) => question.label)
    .filter((label) => label !== CORE_QUESTIONS[7]?.label);

  if (missing.length > 0) {
    throw new Error(`Missing answers for: ${missing.join(", ")}`);
  }
}

export async function submitLead(token: string, input: SubmitLeadInput) {
  return mutateState((state) => {
    const lead = state.leads.find((entry) => entry.token === token);
    if (!lead) {
      throw new Error("Lead not found.");
    }

    if (new Date(lead.tokenExpiresAt).getTime() < Date.now()) {
      throw new Error("This intake link has expired.");
    }

    const settings = state.agentSettings.find((entry) => entry.agentId === lead.agentId);
    if (!settings) {
      throw new Error("Agent settings not found.");
    }

    assertCompleteAnswers(input.answers);
    const scored = scoreLead(input.answers, settings.showThreshold);

    lead.answers = input.answers;
    lead.customAnswers = input.customAnswers ?? {};
    lead.score = scored.total;
    lead.recommendation = scored.recommendation;
    lead.summary = scored.summary;
    lead.scoreBreakdown = scored.breakdown;
    lead.status = "submitted";
    lead.pipelineStage = recommendationToStage(scored.recommendation);
    lead.submittedAt = nowIso();
    lead.updatedAt = nowIso();

    return {
      lead,
      settings
    };
  });
}

export async function updateLeadStage(
  agentId: string,
  leadId: string,
  pipelineStage: LeadStage
) {
  return mutateState((state) => {
    const lead = state.leads.find(
      (entry) => entry.agentId === agentId && entry.id === leadId
    );

    if (!lead) {
      throw new Error("Lead not found.");
    }

    lead.pipelineStage = pipelineStage;
    lead.updatedAt = nowIso();

    return lead;
  });
}

export async function overrideLeadScore(
  agentId: string,
  leadId: string,
  overrideScore: number,
  note: string
) {
  return mutateState((state) => {
    const lead = state.leads.find(
      (entry) => entry.agentId === agentId && entry.id === leadId
    );

    if (!lead || lead.score === undefined || !lead.recommendation) {
      throw new Error("Scored lead not found.");
    }

    const overrideRecommendation: Recommendation =
      overrideScore >= 8 ? "show" : overrideScore >= 5 ? "nurture" : "hold";

    const override: ScoreOverride = {
      id: randomUUID(),
      originalScore: lead.score,
      originalRecommendation: lead.recommendation,
      overrideScore,
      overrideRecommendation,
      note,
      createdAt: nowIso(),
      createdByAgentId: agentId
    };

    lead.scoreOverride = override;
    lead.score = overrideScore;
    lead.recommendation = overrideRecommendation;
    lead.pipelineStage = recommendationToStage(overrideRecommendation);
    lead.updatedAt = nowIso();

    return lead;
  });
}

export async function getAnalyticsSummary(agentId: string) {
  const leads = await listLeads(agentId);
  const ready = leads.filter((lead) => lead.pipelineStage === "ready").length;
  const nurture = leads.filter((lead) => lead.pipelineStage === "nurture").length;
  const hold = leads.filter((lead) => lead.pipelineStage === "hold").length;
  const averageScore =
    leads.filter((lead) => typeof lead.score === "number").reduce((sum, lead) => {
      return sum + (lead.score ?? 0);
    }, 0) / Math.max(leads.filter((lead) => typeof lead.score === "number").length, 1);

  return {
    totalLeads: leads.length,
    ready,
    nurture,
    hold,
    averageScore: Number.parseFloat(averageScore.toFixed(2))
  };
}

export async function trackAnalyticsEvent(
  name: string,
  metadata?: AnalyticsEvent["metadata"],
  agentId?: string
) {
  return mutateState((state) => {
    state.analyticsEvents.push({
      id: randomUUID(),
      name,
      metadata,
      agentId,
      createdAt: nowIso()
    });
  });
}
