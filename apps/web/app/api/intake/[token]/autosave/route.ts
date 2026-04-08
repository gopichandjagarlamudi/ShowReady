import { NextResponse } from "next/server";
import { captureServerError } from "@/lib/observability";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { autosaveInviteDraft } from "@/lib/supabase/data";
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
    await autosaveInviteDraft(supabase, token, payload.draft);
    return NextResponse.json({ ok: true });
  } catch (error) {
    captureServerError(error, "api.intake.autosave");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save answer." },
      { status: 400 }
    );
  }
}
