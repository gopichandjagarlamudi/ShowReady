import { NextResponse } from "next/server";
import { getCurrentAgentId } from "@/lib/session";
import { captureServerError } from "@/lib/observability";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createLead, listLeads } from "@/lib/supabase/data";

export async function GET() {
  const agentId = await getCurrentAgentId();
  if (!agentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient()
  const leads = await listLeads(supabase, agentId);
  return NextResponse.json({ leads });
}

export async function POST(request: Request) {
  const agentId = await getCurrentAgentId();
  if (!agentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createSupabaseServerClient()
    const payload = (await request.json()) as {
      intakeType?: "sale" | "rental";
      buyerName: string;
      buyerPhone?: string;
      buyerEmail?: string;
    };
    const lead = await createLead(supabase, agentId, {
      ...payload,
      intakeType: payload.intakeType ?? "sale"
    });
    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    captureServerError(error, "api.leads.create");
    return NextResponse.json({ error: "Unable to create lead." }, { status: 400 });
  }
}
