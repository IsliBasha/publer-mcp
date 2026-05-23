import { createPublerServices } from '@publer-mcp/publer-client'

let services: ReturnType<typeof createPublerServices> | null = null

export function getPubServices() {
  if (!services) {
    const apiKey = process.env.PUBLER_API_KEY
    if (!apiKey) throw new Error('PUBLER_API_KEY is not configured')
    services = createPublerServices(apiKey, process.env.PUBLER_WORKSPACE_ID)
  }
  return services
}
