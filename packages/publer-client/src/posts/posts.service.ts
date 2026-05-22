import { AxiosInstance } from 'axios'
import type { CreatePost, SchedulePost, UpdateScheduledPost, ScheduledPost, Platform } from '@publer-mcp/shared-types'
import type { PublerApiPost, PublerApiPostsResponse, PublerApiAccount } from '../types/publer-api.js'

function mapApiPostToScheduledPost(post: PublerApiPost, platform?: Platform): ScheduledPost {
  return {
    id: post.id,
    content: post.text,
    platforms: platform ? [platform] : [],
    scheduledAt: post.scheduled_at ?? post.updated_at,
    status: post.state,
    accountIds: [post.account_id],
    mediaUrls: [],
    createdAt: post.updated_at,
    updatedAt: post.updated_at,
    publerPostId: post.id,
  }
}

export class PostsService {
  private accountPlatformCache: Map<string, Platform> | null = null

  constructor(private readonly client: AxiosInstance) {}

  private async getAccountPlatformMap(): Promise<Map<string, Platform>> {
    if (this.accountPlatformCache) return this.accountPlatformCache
    const response = await this.client.get<PublerApiAccount[]>('/accounts')
    this.accountPlatformCache = new Map(
      response.data.map((a) => [a.id, a.provider as Platform])
    )
    return this.accountPlatformCache
  }

  async createPost(_data: CreatePost): Promise<ScheduledPost> {
    // Publer API v1 does not expose a POST /posts endpoint — use the Publer web app to create posts.
    throw new Error('Publer API v1 does not support creating posts programmatically. Use the Publer web app or schedule posts there, then manage them via this MCP server.')
  }

  async schedulePost(_data: SchedulePost): Promise<ScheduledPost> {
    // Publer API v1 does not expose a POST /posts endpoint — use the Publer web app to create posts.
    throw new Error('Publer API v1 does not support scheduling posts programmatically. Use the Publer web app to create and schedule posts, then manage them via this MCP server.')
  }

  async listScheduledPosts(params: {
    page?: number
    limit?: number
    platform?: string
    from?: string
    to?: string
  }): Promise<{ posts: ScheduledPost[]; total: number }> {
    // API uses "state" not "status"; passing "page" returns empty posts[] — strip it
    const { page: _page, limit, platform, from, to } = params
    const [postsResponse, platformMap] = await Promise.all([
      this.client.get<PublerApiPostsResponse>('/posts', {
        params: { state: 'scheduled', limit, platform, from, to },
      }),
      this.getAccountPlatformMap(),
    ])
    return {
      posts: postsResponse.data.posts.map((post) =>
        mapApiPostToScheduledPost(post, platformMap.get(post.account_id))
      ),
      total: postsResponse.data.total ?? 0,
    }
  }

  async updateScheduledPost(data: UpdateScheduledPost): Promise<ScheduledPost> {
    const payload: Record<string, unknown> = {}
    if (data.content) payload.text = data.content
    if (data.scheduledAt) payload.scheduled_at = data.scheduledAt
    if (data.mediaUrls) payload.media_urls = data.mediaUrls

    const response = await this.client.patch<PublerApiPost>(`/posts/${data.id}`, payload)
    return mapApiPostToScheduledPost(response.data)
  }

  async deletePost(_postId: string): Promise<void> {
    // Publer API v1 does not expose a DELETE /posts/:id endpoint.
    throw new Error('Publer API v1 does not support deleting posts programmatically. Delete posts via the Publer web app.')
  }
}
