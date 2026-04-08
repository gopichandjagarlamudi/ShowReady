export type CoreQuestionKey =
  | "timeline"
  | "financing"
  | "budgetBand"
  | "exclusiveAgent"
  | "moveReasons"
  | "priorShowings"
  | "offerReadiness"
  | "notes";

export type Timeline = "asap" | "1_3mo" | "3_6mo" | "6_12mo" | "exploring";
export type Financing = "cash" | "pre_approved" | "in_progress" | "no";
export type BudgetBand =
  | "under_200k"
  | "200k_400k"
  | "400k_600k"
  | "600k_800k"
  | "800k_1m"
  | "1m_plus";
export type ExclusiveAgent = "no" | "yes_not_exclusive" | "yes_exclusive";
export type MoveReason =
  | "job_change"
  | "upsize"
  | "upsizing"
  | "downsizing"
  | "investment"
  | "relocation"
  | "lifestyle"
  | "lease_ending";
export type PriorShowings = "many" | "few" | "none";
export type OfferReadiness = 1 | 2 | 3 | 4 | 5;
export type LeadStatus = "pending" | "submitted" | "archived";
export type LeadStage = "new" | "ready" | "nurture" | "hold" | "closed";
export type Recommendation = "show" | "nurture" | "hold";
export type RecommendationTone = Recommendation;
export type NotificationPreference = "email" | "email_and_push";
export type IntakeType = "sale" | "rental";

export type IntakeAnswers = {
  timeline: Timeline;
  financing: Financing;
  budgetBand: BudgetBand;
  exclusiveAgent: ExclusiveAgent;
  moveReasons: MoveReason[];
  priorShowings: PriorShowings;
  offerReadiness: OfferReadiness;
  notes: string;
};

export type ScoreBreakdown = {
  timeline: number;
  financing: number;
  commitment: number;
  motivation: number;
  awareness: number;
};

export type ScoreResult = {
  total: number;
  breakdown: ScoreBreakdown;
  recommendation: Recommendation;
  summary: string;
  effectiveShowThreshold: number;
};

export type ScoreOverride = {
  id: string;
  originalScore: number;
  originalRecommendation: Recommendation;
  overrideScore: number;
  overrideRecommendation: Recommendation;
  note: string;
  createdAt: string;
  createdByAgentId: string;
};

export type CustomQuestionType = "single_select" | "multi_select" | "text";

export type QuestionOption = {
  label: string;
  value: string;
};

export type CustomQuestion = {
  id: string;
  label: string;
  type: CustomQuestionType;
  required: boolean;
  helperText?: string;
  options?: QuestionOption[];
};

export type QuestionTemplate = {
  id: string;
  intakeType: IntakeType;
  name: string;
  introHeadline: string;
  introBody: string;
  customQuestions: CustomQuestion[];
};

export type AgentProfile = {
  id: string;
  email: string;
  fullName: string;
  brokerage?: string;
  licenseNumber?: string;
  photoUrl?: string;
  logoUrl?: string;
  onboardedAt?: string;
};

export type AgentSettings = {
  agentId: string;
  brandName: string;
  brandColor: string;
  accentColor: string;
  showThreshold: number;
  notificationPreference: NotificationPreference;
  questionTemplateId: string;
};

export type Lead = {
  id: string;
  agentId: string;
  intakeType: IntakeType;
  buyerName: string;
  buyerPhone?: string;
  buyerEmail?: string;
  token: string;
  tokenExpiresAt: string;
  status: LeadStatus;
  pipelineStage: LeadStage;
  submittedAt?: string;
  score?: number;
  recommendation?: Recommendation;
  summary?: string;
  createdAt: string;
  updatedAt: string;
  answers?: Partial<IntakeAnswers>;
  customAnswers?: Record<string, string | string[]>;
  scoreBreakdown?: ScoreBreakdown;
  scoreOverride?: ScoreOverride;
};

export type NavigationItem = {
  href: string;
  label: string;
  icon: string;
};

export type QuestionDefinition = {
  key: CoreQuestionKey;
  label: string;
  helperText?: string;
  type: "single_select" | "multi_select" | "slider" | "textarea";
  options?: QuestionOption[];
  min?: number;
  max?: number;
  step?: number;
};

export const CORE_QUESTION_ORDER: CoreQuestionKey[] = [
  "timeline",
  "financing",
  "budgetBand",
  "exclusiveAgent",
  "moveReasons",
  "priorShowings",
  "offerReadiness",
  "notes"
];

export const SALE_CORE_QUESTIONS: QuestionDefinition[] = [
  {
    key: "timeline",
    label: "What is your timeline to move?",
    helperText: "This helps your agent prioritize the search.",
    type: "single_select",
    options: [
      { label: "ASAP", value: "asap" },
      { label: "1–3 months", value: "1_3mo" },
      { label: "3–6 months", value: "3_6mo" },
      { label: "6–12 months", value: "6_12mo" },
      { label: "Just exploring", value: "exploring" }
    ]
  },
  {
    key: "financing",
    label: "Have you been pre-approved for a mortgage?",
    type: "single_select",
    options: [
      { label: "Paying cash", value: "cash" },
      { label: "Yes, pre-approved", value: "pre_approved" },
      { label: "In progress", value: "in_progress" },
      { label: "Not yet", value: "no" }
    ]
  },
  {
    key: "budgetBand",
    label: "What is your rough budget range?",
    type: "single_select",
    options: [
      { label: "Under $200k", value: "under_200k" },
      { label: "$200k–$400k", value: "200k_400k" },
      { label: "$400k–$600k", value: "400k_600k" },
      { label: "$600k–$800k", value: "600k_800k" },
      { label: "$800k–$1M", value: "800k_1m" },
      { label: "$1M+", value: "1m_plus" }
    ]
  },
  {
    key: "exclusiveAgent",
    label: "Are you currently working with another agent?",
    type: "single_select",
    options: [
      { label: "No", value: "no" },
      { label: "Yes, but not exclusive", value: "yes_not_exclusive" },
      { label: "Yes, exclusively", value: "yes_exclusive" }
    ]
  },
  {
    key: "moveReasons",
    label: "What is the main reason for your move?",
    type: "multi_select",
    options: [
      { label: "Job change", value: "job_change" },
      { label: "Upsizing", value: "upsizing" },
      { label: "Downsizing", value: "downsizing" },
      { label: "Investment", value: "investment" },
      { label: "Relocation", value: "relocation" },
      { label: "Lifestyle", value: "lifestyle" },
      { label: "Lease ending", value: "lease_ending" }
    ]
  },
  {
    key: "priorShowings",
    label: "Have you visited any properties in person yet?",
    type: "single_select",
    options: [
      { label: "Yes, many", value: "many" },
      { label: "A few", value: "few" },
      { label: "None yet", value: "none" }
    ]
  },
  {
    key: "offerReadiness",
    label: "How ready are you to make an offer?",
    helperText: "1 means just researching, 5 means ready to offer today.",
    type: "slider",
    min: 1,
    max: 5,
    step: 1
  },
  {
    key: "notes",
    label: "Anything else you want your agent to know?",
    helperText: "Optional. Keep it short and practical.",
    type: "textarea"
  }
];

export const RENTAL_CORE_QUESTIONS: QuestionDefinition[] = [
  {
    key: "timeline",
    label: "What is your timeline to move?",
    helperText: "This helps your agent prioritize the rental search.",
    type: "single_select",
    options: [
      { label: "ASAP", value: "asap" },
      { label: "1–3 months", value: "1_3mo" },
      { label: "3–6 months", value: "3_6mo" },
      { label: "6–12 months", value: "6_12mo" },
      { label: "Just exploring", value: "exploring" }
    ]
  },
  {
    key: "financing",
    label: "Do you have your rental application documents ready?",
    helperText: "Think proof of income, credit, ID, and references.",
    type: "single_select",
    options: [
      { label: "Yes, fully ready", value: "cash" },
      { label: "Mostly ready", value: "pre_approved" },
      { label: "In progress", value: "in_progress" },
      { label: "Not yet", value: "no" }
    ]
  },
  {
    key: "budgetBand",
    label: "What monthly rent range feels comfortable?",
    type: "single_select",
    options: [
      { label: "Under $1,500/mo", value: "under_200k" },
      { label: "$1,500–$2,000/mo", value: "200k_400k" },
      { label: "$2,000–$2,500/mo", value: "400k_600k" },
      { label: "$2,500–$3,500/mo", value: "600k_800k" },
      { label: "$3,500–$5,000/mo", value: "800k_1m" },
      { label: "$5,000+/mo", value: "1m_plus" }
    ]
  },
  {
    key: "exclusiveAgent",
    label: "Are you already working with another leasing agent?",
    type: "single_select",
    options: [
      { label: "No", value: "no" },
      { label: "Yes, but not exclusively", value: "yes_not_exclusive" },
      { label: "Yes, exclusively", value: "yes_exclusive" }
    ]
  },
  {
    key: "moveReasons",
    label: "Why are you looking for a rental right now?",
    type: "multi_select",
    options: [
      { label: "Job change", value: "job_change" },
      { label: "Need more space", value: "upsizing" },
      { label: "Need less space", value: "downsizing" },
      { label: "Investment", value: "investment" },
      { label: "Relocation", value: "relocation" },
      { label: "Lifestyle", value: "lifestyle" },
      { label: "Current lease ending", value: "lease_ending" }
    ]
  },
  {
    key: "priorShowings",
    label: "Have you toured any rentals in person yet?",
    type: "single_select",
    options: [
      { label: "Yes, many", value: "many" },
      { label: "A few", value: "few" },
      { label: "None yet", value: "none" }
    ]
  },
  {
    key: "offerReadiness",
    label: "How ready are you to apply for a rental?",
    helperText: "1 means still researching, 5 means ready to apply right away.",
    type: "slider",
    min: 1,
    max: 5,
    step: 1
  },
  {
    key: "notes",
    label: "Anything your agent should know about your rental search?",
    helperText: "Optional. Keep it short and practical.",
    type: "textarea"
  }
];

export const CORE_QUESTIONS: QuestionDefinition[] = SALE_CORE_QUESTIONS;

export const DEFAULT_TEMPLATE: QuestionTemplate = {
  id: "default-sale-template",
  intakeType: "sale",
  name: "ShowReady Standard",
  introHeadline: "A quick step before your first showing",
  introBody:
    "This takes about two minutes and helps your agent focus on homes that actually fit your timeline and budget.",
  customQuestions: []
};

export const DEFAULT_RENTAL_TEMPLATE: QuestionTemplate = {
  id: "default-rental-template",
  intakeType: "rental",
  name: "ShowReady Rental",
  introHeadline: "A quick step before your rental tour",
  introBody:
    "This takes about two minutes and helps your agent focus on rentals that fit your timing, budget, and application readiness.",
  customQuestions: []
};

export const DEFAULT_TEMPLATES: Record<IntakeType, QuestionTemplate> = {
  sale: DEFAULT_TEMPLATE,
  rental: DEFAULT_RENTAL_TEMPLATE
};

export function getCoreQuestionsForIntakeType(
  intakeType: IntakeType
): QuestionDefinition[] {
  return intakeType === "rental" ? RENTAL_CORE_QUESTIONS : SALE_CORE_QUESTIONS;
}

export function getDefaultTemplateForIntakeType(
  intakeType: IntakeType
): QuestionTemplate {
  return DEFAULT_TEMPLATES[intakeType];
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "layout-dashboard" },
  { href: "/leads", label: "Leads", icon: "users" },
  { href: "/settings", label: "Settings", icon: "settings-2" }
];
