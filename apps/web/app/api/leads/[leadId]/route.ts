import { NextResponse } from "next/server";
import { getCurrentAgentId } from "@/lib/session";
import { captureServerError } from "@/lib/observability";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getLeadById, overrideLeadScore, updateLeadStage } from "@/lib/supabase/data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const { leadId } = await params;
  const agentId = await getCurrentAgentId();
  if (!agentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient()
  const lead = await getLeadById(supabase, agentId, leadId);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json({ lead });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const { leadId } = await params;
  const agentId = await getCurrentAgentId();
  if (!agentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createSupabaseServerClient()
    const payload = (await request.json()) as
      | {
          pipelineStage:
            | "ready_to_show"
            | "nurture"
            | "hold"
            | "closed_won"
            | "closed_lost"
            | "archived"
        }
      | { overrideScore: number; note: string };

    if ("pipelineStage" in payload) {
      const lead = await updateLeadStage(supabase, agentId, leadId, payload.pipelineStage);
      return NextResponse.json({ lead });
    }

    const lead = await overrideLeadScore(
      supabase,
      agentId,
      leadId,
      payload.overrideScore,
      payload.note
    );
    return NextResponse.json({ lead });
  } catch (error) {
    captureServerError(error, "api.leads.patch");
    return NextResponse.json({ error: "Unable to update lead." }, { status: 400 });
  }
}
