import { describe, it, expect, vi } from 'vitest'
import { registerPostTools } from './post-tools.js'

type Handler = (params: Record<string, unknown>) => Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }>

function createFakeServer() {
  const handlers: Record<string, Handler> = {}
  const server = {
    tool: (name: string, _desc: string, _schema: unknown, handler: Handler) => {
      handlers[name] = handler
    },
  }
  return { server: server as any, handlers }
}

function parse(result: { content: Array<{ type: string; text: string }> }) {
  return JSON.parse(result.content[0].text)
}

function makeService(overrides: Record<string, ReturnType<typeof vi.fn>> = {}) {
  return {
    createPost: vi.fn().mockResolvedValue({ id: 'p1', content: 'Test', platforms: ['linkedin'] }),
    schedulePost: vi.fn().mockResolvedValue({ id: 'p1', content: 'Test', platforms: ['linkedin'] }),
    listScheduledPosts: vi.fn().mockResolvedValue({ posts: [{ id: 'p1' }], total: 1 }),
    updateScheduledPost: vi.fn().mockResolvedValue({ id: 'p1', content: 'Updated', platforms: ['linkedin'] }),
    deletePost: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

// ─── create_post ──────────────────────────────────────────────────────────────

describe('create_post', () => {
  it('calls createPost with publishNow=true and returns success', async () => {
    const { server, handlers } = createFakeServer()
    const service = makeService()
    registerPostTools(server, service as any)

    const result = await handlers['create_post']({ content: 'Hello', platforms: ['linkedin'] })

    expect(service.createPost).toHaveBeenCalledWith({
      content: 'Hello',
      platforms: ['linkedin'],
      mediaUrls: undefined,
      accountIds: undefined,
      publishNow: true,
    })
    expect(result.isError).toBeFalsy()
    expect(parse(result).message).toBe('Post published successfully')
  })

  it('returns errorResponse when createPost throws', async () => {
    const { server, handlers } = createFakeServer()
    const service = makeService({ createPost: vi.fn().mockRejectedValue(new Error('API not supported')) })
    registerPostTools(server, service as any)

    const result = await handlers['create_post']({ content: 'Hello', platforms: ['linkedin'] })

    expect(result.isError).toBe(true)
    expect(parse(result).error).toBe('API not supported')
  })

  it('truncates content to 100 chars in error details', async () => {
    const { server, handlers } = createFakeServer()
    const service = makeService({ createPost: vi.fn().mockRejectedValue(new Error('fail')) })
    registerPostTools(server, service as any)

    const result = await handlers['create_post']({ content: 'a'.repeat(200), platforms: ['linkedin'] })

    expect(parse(result).details.content).toHaveLength(100)
  })
})

// ─── schedule_post ────────────────────────────────────────────────────────────

describe('schedule_post', () => {
  it('calls schedulePost and returns scheduled time in message', async () => {
    const { server, handlers } = createFakeServer()
    const service = makeService()
    registerPostTools(server, service as any)
    const scheduledAt = '2026-06-01T09:00:00.000Z'

    const result = await handlers['schedule_post']({
      content: 'Scheduled post',
      platforms: ['twitter'],
      scheduledAt,
      timezone: 'UTC',
    })

    expect(service.schedulePost).toHaveBeenCalledWith(expect.objectContaining({ publishNow: false, scheduledAt }))
    expect(result.isError).toBeFalsy()
    expect(parse(result).message).toContain(scheduledAt)
  })

  it('returns errorResponse when schedulePost throws', async () => {
    const { server, handlers } = createFakeServer()
    const service = makeService({ schedulePost: vi.fn().mockRejectedValue(new Error('not supported')) })
    registerPostTools(server, service as any)

    const result = await handlers['schedule_post']({
      content: 'Post',
      platforms: ['twitter'],
      scheduledAt: '2026-06-01T09:00:00.000Z',
      timezone: 'UTC',
    })

    expect(result.isError).toBe(true)
    expect(parse(result).error).toBe('not supported')
  })
})

// ─── list_scheduled_posts ─────────────────────────────────────────────────────

describe('list_scheduled_posts', () => {
  it('returns posts with page and limit echoed back', async () => {
    const { server, handlers } = createFakeServer()
    const service = makeService()
    registerPostTools(server, service as any)

    const result = await handlers['list_scheduled_posts']({ page: 2, limit: 10 })

    expect(result.isError).toBeFalsy()
    const data = parse(result)
    expect(data.posts).toHaveLength(1)
    expect(data.page).toBe(2)
    expect(data.limit).toBe(10)
    expect(data.total).toBe(1)
  })

  it('returns errorResponse when listScheduledPosts throws', async () => {
    const { server, handlers } = createFakeServer()
    const service = makeService({ listScheduledPosts: vi.fn().mockRejectedValue(new Error('network error')) })
    registerPostTools(server, service as any)

    const result = await handlers['list_scheduled_posts']({ page: 1, limit: 20 })

    expect(result.isError).toBe(true)
    expect(parse(result).error).toBe('network error')
  })
})

// ─── update_scheduled_post ────────────────────────────────────────────────────

describe('update_scheduled_post', () => {
  it('calls updateScheduledPost and returns success', async () => {
    const { server, handlers } = createFakeServer()
    const service = makeService()
    registerPostTools(server, service as any)

    const result = await handlers['update_scheduled_post']({ id: 'p1', content: 'New content' })

    expect(service.updateScheduledPost).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1', content: 'New content' }))
    expect(result.isError).toBeFalsy()
    expect(parse(result).message).toBe('Post updated successfully')
  })

  it('returns errorResponse with postId in details when update throws', async () => {
    const { server, handlers } = createFakeServer()
    const service = makeService({ updateScheduledPost: vi.fn().mockRejectedValue(new Error('not found')) })
    registerPostTools(server, service as any)

    const result = await handlers['update_scheduled_post']({ id: 'p99', content: 'text' })

    expect(result.isError).toBe(true)
    const data = parse(result)
    expect(data.error).toBe('not found')
    expect(data.details.postId).toBe('p99')
  })
})

// ─── delete_post ──────────────────────────────────────────────────────────────

describe('delete_post', () => {
  it('returns errorResponse without calling service when confirm=false', async () => {
    const { server, handlers } = createFakeServer()
    const service = makeService()
    registerPostTools(server, service as any)

    const result = await handlers['delete_post']({ postId: 'p1', confirm: false })

    expect(service.deletePost).not.toHaveBeenCalled()
    expect(result.isError).toBe(true)
    expect(parse(result).error).toContain('confirmation')
  })

  it('calls deletePost and returns success when confirm=true', async () => {
    const { server, handlers } = createFakeServer()
    const service = makeService()
    registerPostTools(server, service as any)

    const result = await handlers['delete_post']({ postId: 'p1', confirm: true })

    expect(service.deletePost).toHaveBeenCalledWith('p1')
    expect(result.isError).toBeFalsy()
    expect(parse(result).message).toContain('p1')
  })

  it('returns errorResponse with postId when deletePost throws', async () => {
    const { server, handlers } = createFakeServer()
    const service = makeService({ deletePost: vi.fn().mockRejectedValue(new Error('not supported')) })
    registerPostTools(server, service as any)

    const result = await handlers['delete_post']({ postId: 'p5', confirm: true })

    expect(result.isError).toBe(true)
    const data = parse(result)
    expect(data.error).toBe('not supported')
    expect(data.details.postId).toBe('p5')
  })
})
