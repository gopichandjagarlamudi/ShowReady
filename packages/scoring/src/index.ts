import type {
  ExclusiveAgent,
  Financing,
  IntakeAnswers,
  MoveReason,
  PriorShowings,
  Recommendation,
  ScoreBreakdown,
  ScoreResult,
  Timeline
} from "@showready/types";

const TIMELINE_SCORES: Record<Timeline, number> = {
  asap: 10,
  "1_3mo": 8,
  "3_6mo": 5,
  "6_12mo": 2.5,
  exploring: 1
};

const FINANCING_SCORES: Record<Financing, number> = {
  cash: 10,
  pre_approved: 9,
  in_progress: 5,
  no: 1
};

const AWARENESS_SCORES: Record<PriorShowings, number> = {
  many: 8,
  few: 5,
  none: 3
};

const URGENT_REASONS = new Set<MoveReason>([
  "job_change",
  "relocation",
  "lease_ending"
]);

const WEIGHTS = {
  timeline: 0.28,
  financing: 0.28,
  commitment: 0.2,
  motivation: 0.14,
  awareness: 0.1
} as const;

function scoreMotivation(reasons: MoveReason[]): number {
  const urgentCount = reasons.filter((reason) => URGENT_REASONS.has(reason))
    .length;

  if (urgentCount >= 2) {
    return 10;
  }

  if (urgentCount === 1) {
    return 7;
  }

  return 4;
}

function scoreCommitment(
  offerReadiness: number,
  exclusiveAgent: ExclusiveAgent
): number {
  const base = offerReadiness * 2;
  const penalty = exclusiveAgent === "yes_exclusive" ? 2 : 0;

  return Math.max(0, Math.min(10, base - penalty));
}

function applyOverrides(score: number, answers: IntakeAnswers): number {
  let adjusted = score;

  if (answers.financing === "no" && answers.timeline === "asap") {
    adjusted = Math.min(adjusted, 5);
  }

  if (answers.exclusiveAgent === "yes_exclusive") {
    adjusted = Math.max(1, adjusted - 2);
  }

  if (answers.financing === "cash" && answers.timeline === "asap") {
    adjusted = Math.max(adjusted, 8.5);
  }

  return adjusted;
}

function getRecommendation(
  total: number,
  showThreshold: number
): Recommendation {
  if (total >= showThreshold) {
    return "show";
  }

  if (total >= 5) {
    return "nurture";
  }

  return "hold";
}

function buildSummary(
  score: number,
  breakdown: ScoreBreakdown,
  answers: IntakeAnswers,
  recommendation: Recommendation
): string {
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (breakdown.timeline >= 8) {
    strengths.push("strong timeline urgency");
  } else if (breakdown.timeline <= 2.5) {
    concerns.push("no clear move timeline");
  }

  if (breakdown.financing >= 9) {
    strengths.push(`solid financing (${answers.financing})`);
  } else if (breakdown.financing <= 1) {
    concerns.push("no financing in place");
  }

  if (breakdown.commitment >= 8) {
    strengths.push("high offer readiness");
  }

  if (answers.exclusiveAgent === "yes_exclusive") {
    concerns.push("already committed to another agent");
  }

  if (breakdown.motivation >= 7) {
    strengths.push("motivated by urgency");
  }

  const strengthsSummary = strengths.length
    ? `Strengths: ${strengths.join(", ")}. `
    : "";
  const concernsSummary = concerns.length
    ? `Watch: ${concerns.join(", ")}. `
    : "";

  const action =
    recommendation === "show"
      ? "Recommend booking a showing now."
      : recommendation === "nurture"
        ? "Follow up in 2–4 weeks."
        : "Park in a longer-term nurture campaign.";

  return `Score ${score}/10. ${strengthsSummary}${concernsSummary}${action}`.trim();
}

export function getScoreBreakdown(answers: IntakeAnswers): ScoreBreakdown {
  return {
    timeline: TIMELINE_SCORES[answers.timeline],
    financing: FINANCING_SCORES[answers.financing],
    commitment: scoreCommitment(
      answers.offerReadiness,
      answers.exclusiveAgent
    ),
    motivation: scoreMotivation(answers.moveReasons),
    awareness: AWARENESS_SCORES[answers.priorShowings]
  };
}

export function scoreLead(
  answers: IntakeAnswers,
  showThreshold = 8
): ScoreResult {
  const breakdown = getScoreBreakdown(answers);
  const rawScore =
    breakdown.timeline * WEIGHTS.timeline +
    breakdown.financing * WEIGHTS.financing +
    breakdown.commitment * WEIGHTS.commitment +
    breakdown.motivation * WEIGHTS.motivation +
    breakdown.awareness * WEIGHTS.awareness;

  const total = Number.parseFloat(
    applyOverrides(rawScore, answers).toFixed(2)
  );
  const recommendation = getRecommendation(total, showThreshold);

  return {
    total,
    breakdown,
    recommendation,
    summary: buildSummary(total, breakdown, answers, recommendation),
    effectiveShowThreshold: showThreshold
  };
}

export const scoringConfig = {
  weights: WEIGHTS,
  timeline: TIMELINE_SCORES,
  financing: FINANCING_SCORES,
  awareness: AWARENESS_SCORES
};
