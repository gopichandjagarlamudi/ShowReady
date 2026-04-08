import { NextResponse } from "next/server";
import { buildAppUrl } from "@/lib/utils";
import { captureServerError } from "@/lib/observability";
import { sendLeadScoredEmail } from "@/lib/notifications";
import { trackServerEvent } from "@/lib/analytics";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAgentContext, submitInvite } from "@/lib/supabase/data";
import type { IntakeDraft } from "@showready/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const supabase = createSupabaseAdminClient()
    const payload = (await request.json()) as {
      draft: IntakeDraft;
    };

    const { lead } = await submitInvite(supabase, token, payload);
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
