import { PostHog } from "posthog-node"

let posthogClient: PostHog | null | undefined

function getPosthogClient() {
  if (posthogClient !== undefined) {
    return posthogClient
  }

  if (!process.env.POSTHOG_KEY) {
    posthogClient = null
    return posthogClient
  }

  posthogClient = new PostHog(process.env.POSTHOG_KEY, {
    host: process.env.POSTHOG_HOST
  })

  return posthogClient
}

export async function trackServerEvent(
  name: string,
  metadata?: Record<string, string | number | boolean>,
  agentId?: string
) {
  const client = getPosthogClient()
  if (!client) {
    return
  }

  await client.capture({
    distinctId: agentId ?? "anonymous",
    event: name,
    properties: metadata
  })
}
