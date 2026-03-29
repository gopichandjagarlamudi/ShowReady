import { NextResponse } from "next/server";
import { getCurrentAgentId } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAnalyticsSummary } from "@/lib/supabase/data";

export async function GET() {
  const agentId = await getCurrentAgentId();
  if (!agentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient()
  const summary = await getAnalyticsSummary(supabase, agentId);
  return NextResponse.json(summary);
}
