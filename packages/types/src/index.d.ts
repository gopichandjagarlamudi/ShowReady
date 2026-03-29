export type CoreQuestionKey = "timeline" | "financing" | "budgetBand" | "exclusiveAgent" | "moveReasons" | "priorShowings" | "offerReadiness" | "notes";
export type Timeline = "asap" | "1_3mo" | "3_6mo" | "6_12mo" | "exploring";
export type Financing = "cash" | "pre_approved" | "in_progress" | "no";
export type BudgetBand = "under_200k" | "200k_400k" | "400k_600k" | "600k_800k" | "800k_1m" | "1m_plus";
export type ExclusiveAgent = "no" | "yes_not_exclusive" | "yes_exclusive";
export type MoveReason = "job_change" | "upsize" | "upsizing" | "downsizing" | "investment" | "relocation" | "lifestyle" | "lease_ending";
export type PriorShowings = "many" | "few" | "none";
export type OfferReadiness = 1 | 2 | 3 | 4 | 5;
export type LeadStatus = "pending" | "submitted" | "archived";
export type LeadStage = "new" | "ready" | "nurture" | "hold" | "closed";
export type Recommendation = "show" | "nurture" | "hold";
export type RecommendationTone = Recommendation;
export type NotificationPreference = "email" | "email_and_push";
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
export declare const CORE_QUESTION_ORDER: CoreQuestionKey[];
export declare const CORE_QUESTIONS: QuestionDefinition[];
export declare const DEFAULT_TEMPLATE: QuestionTemplate;
export declare const NAVIGATION_ITEMS: NavigationItem[];
//# sourceMappingURL=index.d.ts.map