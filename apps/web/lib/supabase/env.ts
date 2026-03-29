const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export function hasSupabaseEnv() {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

function requireEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export function getSupabaseUrl() {
  return requireEnv(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL")
}

export function getSupabaseAnonKey() {
  return requireEnv(supabaseAnonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY")
}

export function getSupabaseServiceRoleKey() {
  return requireEnv(supabaseServiceRoleKey, "SUPABASE_SERVICE_ROLE_KEY")
}
