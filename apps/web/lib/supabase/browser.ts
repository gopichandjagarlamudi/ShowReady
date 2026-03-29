"use client"

import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "./database"
import { getSupabaseAnonKey, getSupabaseUrl } from "./env"

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient
  }

  browserClient = createBrowserClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey()
  )

  return browserClient
}
