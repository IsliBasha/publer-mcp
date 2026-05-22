import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PostsService } from '@publer-mcp/publer-client'

// Minimal McpServer mock — captures tool handler registrations
const registeredTools: Record<string, Function> = {}
const mockServer = {
  tool: vi.fn((name: string, _desc: string, _schema: unknown, handler: Function) => {
    registeredTools[name] = handler
  }),
}

// Fresh mock PostsService per test
let mockPostsService: Partial<PostsService>

beforeEach(() => {
  vi.clearAllMocks()
  Object.keys(registeredTools).forEach((k) => delete registeredTools[k])

  mockPostsService = {
    createPost: vi.fn(),
    schedulePost: vi.fn(),
    listScheduledPosts: vi.fn(),
    updateScheduledPost: vi.fn(),
    deletePost: vi.fn(),
  }
})

async function loadAndRegister() {
  const { registerPostTools } = await import('../tools/post-tools.js')
  registerPostTools(mockServer as any, mockPostsService as PostsService)
}

describe('post tools — create_post', () => {
  it('calls postsService.createPost with publishNow: true', async () => {
    await loadAndRegister()
    ;(mockPostsService.createPost as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'p1' })

    await registeredTools['create_post']({
      content: 'Hello world',
      platforms: ['linkedin'],
    })

    expect(mockPostsService.createPost).toHaveBeenCalledWith(
      expect.objectContaining({ publishNow: true, content: 'Hello world' })
    )
  })

  it('returns error response when API throws', async () => {
    await loadAndRegister()
    ;(mockPostsService.createPost as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Rate limit exceeded')
    )

    const result = await registeredTools['create_post']({
      content: 'Test post',
      platforms: ['twitter'],
    })

    expect(result.isError).toBe(true)
    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.error).toContain('Rate limit exceeded')
  })
})

describe('post tools — schedule_post', () => {
  it('calls schedulePost with publishNow: false', async () => {
    await loadAndRegister()
    ;(mockPostsService.schedulePost as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'p2' })

    await registeredTools['schedule_post']({
      content: 'Scheduled post',
      platforms: ['instagram'],
      scheduledAt: '2025-01-01T09:00:00Z',
      timezone: 'UTC',
    })

    expect(mockPostsService.schedulePost).toHaveBeenCalledWith(
      expect.objectContaining({ publishNow: false })
    )
  })
})

describe('post tools — delete_post', () => {
  it('returns error without calling deletePost when confirm is false', async () => {
    await loadAndRegister()

    const result = await registeredTools['delete_post']({
      postId: 'p123',
      confirm: false,
    })

    expect(result.isError).toBe(true)
    expect(mockPostsService.deletePost).not.toHaveBeenCalled()
  })

  it('calls deletePost when confirm is true', async () => {
    await loadAndRegister()
    ;(mockPostsService.deletePost as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined)

    const result = await registeredTools['delete_post']({
      postId: 'p123',
      confirm: true,
    })

    expect(mockPostsService.deletePost).toHaveBeenCalledWith('p123')
    expect(result.isError).toBeUndefined()
  })
})

describe('post tools — list_scheduled_posts', () => {
  it('passes page and limit to the service', async () => {
    await loadAndRegister()
    ;(mockPostsService.listScheduledPosts as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      posts: [],
      total: 0,
    })

    await registeredTools['list_scheduled_posts']({ page: 2, limit: 10 })

    expect(mockPostsService.listScheduledPosts).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 10 })
    )
  })
})
