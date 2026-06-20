import { createPublerServices } from '@publer-mcp/publer-client'

let services: ReturnType<typeof createPublerServices> | null = null

export function getPubServices(): ReturnType<typeof createPublerServices> | null {
  if (!services) {
    const apiKey = process.env.PUBLER_API_KEY
    if (!apiKey) return null
    services = createPublerServices(apiKey, process.env.PUBLER_WORKSPACE_ID)
  }
  return services
}
