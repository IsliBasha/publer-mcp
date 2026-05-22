import { AxiosInstance } from 'axios'
import type { SocialAccount } from '@publer-mcp/shared-types'
import type { PublerApiAccount } from '../types/publer-api.js'

const SUPPORTED_PLATFORMS = new Set([
  'twitter', 'linkedin', 'instagram', 'facebook', 'tiktok', 'pinterest', 'youtube',
])

export class AccountsService {
  constructor(private readonly client: AxiosInstance) {}

  async listAccounts(): Promise<SocialAccount[]> {
    // API returns a direct array, not { data: [] }
    const response = await this.client.get<PublerApiAccount[]>('/accounts')
    const workspaceId = process.env.PUBLER_WORKSPACE_ID ?? ''
    return response.data
      .filter((a) => SUPPORTED_PLATFORMS.has(a.provider))
      .map((a) => ({
        id: a.id,
        platform: a.provider as SocialAccount['platform'],
        name: a.name,
        username: a.username ?? a.name,
        avatarUrl: a.picture ?? undefined,
        workspaceId,
        isConnected: !a.locked,
        connectedAt: new Date().toISOString(),
      }))
  }
}
