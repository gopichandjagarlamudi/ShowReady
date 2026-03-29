import { NextResponse } from "next/server";
import { captureServerError } from "@/lib/observability";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { autosaveLeadAnswer } from "@/lib/supabase/data";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const supabase = createSupabaseAdminClient()
    const payload = (await request.json()) as {
      questionKey: string;
      value: string | string[] | number;
    };
    await autosaveLeadAnswer(supabase, token, payload.questionKey, payload.value);
    return NextResponse.json({ ok: true });
  } catch (error) {
    captureServerError(error, "api.intake.autosave");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save answer." },
      { status: 400 }
    );
  }
}
