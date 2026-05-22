export { createPublerClient, PublerApiError } from './auth/client.js'
export { PostsService } from './posts/posts.service.js'
export { AnalyticsService } from './analytics/analytics.service.js'
export { AccountsService } from './accounts/accounts.service.js'

export type { PublerApiPost, PublerApiAccount, PublerApiAnalytics } from './types/publer-api.js'

// Convenience factory — creates all services from a single API key
import { createPublerClient } from './auth/client.js'
import { PostsService } from './posts/posts.service.js'
import { AnalyticsService } from './analytics/analytics.service.js'
import { AccountsService } from './accounts/accounts.service.js'
import { createMockServices } from './mock/mock-services.js'

export function createPublerServices(apiKey: string, workspaceId?: string) {
  if (process.env.PUBLER_MOCK === 'true') {
    return createMockServices()
  }
  const client = createPublerClient(apiKey, workspaceId)
  return {
    posts: new PostsService(client),
    analytics: new AnalyticsService(client),
    accounts: new AccountsService(client),
  }
}
