import { NextResponse } from "next/server";
import { buildAppUrl } from "@/lib/utils";
import { captureServerError } from "@/lib/observability";
import { sendLeadScoredEmail } from "@/lib/notifications";
import { trackServerEvent } from "@/lib/analytics";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAgentContext, submitLead } from "@/lib/supabase/data";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const supabase = createSupabaseAdminClient()
    const payload = (await request.json()) as {
      answers: {
        timeline: "asap" | "1_3mo" | "3_6mo" | "6_12mo" | "exploring";
        financing: "cash" | "pre_approved" | "in_progress" | "no";
        budgetBand:
          | "under_200k"
          | "200k_400k"
          | "400k_600k"
          | "600k_800k"
          | "800k_1m"
          | "1m_plus";
        exclusiveAgent: "no" | "yes_not_exclusive" | "yes_exclusive";
        moveReasons: ("job_change" | "upsizing" | "downsizing" | "investment" | "relocation" | "lifestyle" | "lease_ending")[];
        priorShowings: "many" | "few" | "none";
        offerReadiness: 1 | 2 | 3 | 4 | 5;
        notes: string;
      };
      customAnswers?: Record<string, string | string[]>;
    };

    const { lead } = await submitLead(supabase, token, payload);
    const context = await getAgentContext(supabase, lead.agentId);

    if (context?.agent.email) {
      await sendLeadScoredEmail({
        to: context.agent.email,
        agentName: context.agent.fullName,
        buyerName: lead.buyerName,
        recommendation: lead.recommendation ?? "nurture",
        score: lead.score ?? 0,
        detailUrl: buildAppUrl(`/leads/${lead.id}`)
      });
    }

    await trackServerEvent(
      "intake.submitted",
      {
        recommendation: lead.recommendation ?? "nurture"
      },
      lead.agentId
    );

    return NextResponse.json({ lead });
  } catch (error) {
    captureServerError(error, "api.intake.submit");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to submit intake." },
      { status: 400 }
    );
  }
}
