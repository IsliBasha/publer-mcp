import { AxiosInstance } from 'axios'
import type { SocialAccount } from '@publer-mcp/shared-types'
import type { PublerApiAccount } from '../types/publer-api.js'
import { Platform } from '@publer-mcp/shared-types'

export class AccountsService {
  constructor(private readonly client: AxiosInstance) {}

  async listAccounts(): Promise<SocialAccount[]> {
    const response = await this.client.get<{ data: PublerApiAccount[] }>('/accounts')
    return response.data.data.map((a) => ({
      id: a.id,
      platform: a.type as Platform,
      name: a.name,
      username: a.username,
      avatarUrl: a.avatar_url ?? undefined,
      workspaceId: a.workspace_id,
      isConnected: a.is_connected,
      connectedAt: a.connected_at,
    }))
  }
}
