import { NextResponse } from "next/server";
import { getCurrentAgentContext } from "@/lib/session";
import { sendLeadScoredEmail } from "@/lib/notifications";
import { buildAppUrl } from "@/lib/utils";

export async function POST() {
  const context = await getCurrentAgentContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendLeadScoredEmail({
    to: context.agent.email,
    agentName: context.agent.fullName,
    buyerName: "Sample Buyer",
    recommendation: "show",
    score: 8.82,
    detailUrl: buildAppUrl("/dashboard")
  });

  return NextResponse.json(result);
}
