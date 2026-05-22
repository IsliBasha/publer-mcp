import { AxiosInstance } from 'axios'
import type { CreatePost, SchedulePost, UpdateScheduledPost, ScheduledPost } from '@publer-mcp/shared-types'
import type { PublerApiPost } from '../types/publer-api.js'
import { Platform } from '@publer-mcp/shared-types'

function mapApiPostToScheduledPost(post: PublerApiPost): ScheduledPost {
  return {
    id: post.id,
    content: post.text,
    platforms: post.accounts.map((a) => a.type as Platform),
    scheduledAt: post.scheduled_at ?? post.created_at,
    status: post.status,
    accountIds: post.accounts.map((a) => a.id),
    mediaUrls: post.media.map((m) => m.url),
    createdAt: post.created_at,
    updatedAt: post.updated_at,
    publerPostId: post.id,
  }
}

export class PostsService {
  constructor(private readonly client: AxiosInstance) {}

  async createPost(data: CreatePost): Promise<ScheduledPost> {
    const payload = {
      text: data.content,
      account_ids: data.accountIds,
      media_urls: data.mediaUrls,
      should_schedule: !data.publishNow,
      scheduled_at: data.scheduledAt,
    }
    const response = await this.client.post<{ data: PublerApiPost }>('/posts', payload)
    return mapApiPostToScheduledPost(response.data.data)
  }

  async schedulePost(data: SchedulePost): Promise<ScheduledPost> {
    const payload = {
      text: data.content,
      account_ids: data.accountIds,
      media_urls: data.mediaUrls,
      scheduled_at: data.scheduledAt,
      timezone: data.timezone,
      recurring: data.recurring,
    }
    const response = await this.client.post<{ data: PublerApiPost }>('/posts', payload)
    return mapApiPostToScheduledPost(response.data.data)
  }

  async listScheduledPosts(params: {
    page?: number
    limit?: number
    platform?: string
    from?: string
    to?: string
  }): Promise<{ posts: ScheduledPost[]; total: number }> {
    const response = await this.client.get<{ data: PublerApiPost[]; meta: { total: number } }>(
      '/posts',
      { params: { status: 'scheduled', ...params } }
    )
    return {
      posts: response.data.data.map(mapApiPostToScheduledPost),
      total: response.data.meta.total,
    }
  }

  async updateScheduledPost(data: UpdateScheduledPost): Promise<ScheduledPost> {
    const payload: Record<string, unknown> = {}
    if (data.content) payload.text = data.content
    if (data.scheduledAt) payload.scheduled_at = data.scheduledAt
    if (data.mediaUrls) payload.media_urls = data.mediaUrls

    const response = await this.client.patch<{ data: PublerApiPost }>(
      `/posts/${data.id}`,
      payload
    )
    return mapApiPostToScheduledPost(response.data.data)
  }

  async deletePost(postId: string): Promise<void> {
    await this.client.delete(`/posts/${postId}`)
  }
}
