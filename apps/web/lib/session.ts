import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import {
  ensureAgentScaffold,
  getAgentContext
} from "@/lib/supabase/data"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  return user
}

export async function getCurrentAgentId() {
  return (await getCurrentUser())?.id ?? null
}

export async function getCurrentAgentContext() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const supabase = await createSupabaseServerClient()
  let context = await getAgentContext(supabase, user.id)

  if (context) {
    return context
  }

  const admin = createSupabaseAdminClient()
  await ensureAgentScaffold(admin, user)
  context = await getAgentContext(supabase, user.id)

  return context
}
