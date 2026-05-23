import { describe, it, expect, vi } from 'vitest'
import { registerAnalyticsTools } from './analytics-tools.js'

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
    getFollowers: vi.fn().mockResolvedValue([
      { platform: 'linkedin', accountId: 'acc-1', accountName: 'Test', followers: 0 },
    ]),
    getPostAnalytics: vi.fn().mockResolvedValue({
      postId: 'p1',
      content: 'Test post',
      publishedAt: '2026-05-24T10:00:00.000Z',
      metrics: { likes: 0, comments: 0, shares: 0, impressions: 0, engagementRate: 0 },
    }),
    getBestPostingTime: vi.fn().mockResolvedValue({
      platform: 'linkedin',
      recommendations: [{ dayOfWeek: 'Tuesday', hour: 9, confidence: 0.9, expectedEngagementBoost: 15 }],
      reasoning: 'linkedin peaks on Tuesday mornings',
    }),
    ...overrides,
  }
}

// ─── get_followers ────────────────────────────────────────────────────────────

describe('get_followers', () => {
  it('returns metrics with totalAccounts count', async () => {
    const { server, handlers } = createFakeServer()
    const service = makeService()
    registerAnalyticsTools(server, service as any)

    const result = await handlers['get_followers']({})

    expect(result.isError).toBeFalsy()
    const data = parse(result)
    expect(data.metrics).toHaveLength(1)
    expect(data.totalAccounts).toBe(1)
  })

  it('passes accountId filter to service', async () => {
    const { server, handlers } = createFakeServer()
    const service = makeService()
    registerAnalyticsTools(server, service as any)

    await handlers['get_followers']({ accountId: 'acc-1' })

    expect(service.getFollowers).toHaveBeenCalledWith('acc-1')
  })

  it('returns errorResponse when getFollowers throws', async () => {
    const { server, handlers } = createFakeServer()
    const service = makeService({ getFollowers: vi.fn().mockRejectedValue(new Error('api error')) })
    registerAnalyticsTools(server, service as any)

    const result = await handlers['get_followers']({})

    expect(result.isError).toBe(true)
    expect(parse(result).error).toBe('api error')
  })
})

// ─── get_post_analytics ───────────────────────────────────────────────────────

describe('get_post_analytics', () => {
  it('returns analytics data for the given postId', async () => {
    const { server, handlers } = createFakeServer()
    const service = makeService()
    registerAnalyticsTools(server, service as any)

    const result = await handlers['get_post_analytics']({ postId: 'p1' })

    expect(result.isError).toBeFalsy()
    expect(service.getPostAnalytics).toHaveBeenCalledWith('p1')
    expect(parse(result).postId).toBe('p1')
  })

  it('returns errorResponse with postId in details when service throws', async () => {
    const { server, handlers } = createFakeServer()
    const service = makeService({ getPostAnalytics: vi.fn().mockRejectedValue(new Error('not found')) })
    registerAnalyticsTools(server, service as any)

    const result = await handlers['get_post_analytics']({ postId: 'p99' })

    expect(result.isError).toBe(true)
    const data = parse(result)
    expect(data.error).toBe('not found')
    expect(data.details.postId).toBe('p99')
  })
})

// ─── get_best_posting_time ────────────────────────────────────────────────────

describe('get_best_posting_time', () => {
  it('returns timing recommendations for the requested platform', async () => {
    const { server, handlers } = createFakeServer()
    const service = makeService()
    registerAnalyticsTools(server, service as any)

    const result = await handlers['get_best_posting_time']({ platform: 'linkedin' })

    expect(result.isError).toBeFalsy()
    expect(service.getBestPostingTime).toHaveBeenCalledWith('linkedin', undefined)
    const data = parse(result)
    expect(data.platform).toBe('linkedin')
    expect(data.recommendations).toHaveLength(1)
  })

  it('passes accountId to service when provided', async () => {
    const { server, handlers } = createFakeServer()
    const service = makeService()
    registerAnalyticsTools(server, service as any)

    await handlers['get_best_posting_time']({ platform: 'instagram', accountId: 'acc-2' })

    expect(service.getBestPostingTime).toHaveBeenCalledWith('instagram', 'acc-2')
  })

  it('returns errorResponse with platform in details when service throws', async () => {
    const { server, handlers } = createFakeServer()
    const service = makeService({ getBestPostingTime: vi.fn().mockRejectedValue(new Error('timeout')) })
    registerAnalyticsTools(server, service as any)

    const result = await handlers['get_best_posting_time']({ platform: 'tiktok' })

    expect(result.isError).toBe(true)
    const data = parse(result)
    expect(data.error).toBe('timeout')
    expect(data.details.platform).toBe('tiktok')
  })
})

// ─── fetch_engagement_summary ─────────────────────────────────────────────────

describe('fetch_engagement_summary', () => {
  it('returns summary with the requested period', async () => {
    const { server, handlers } = createFakeServer()
    registerAnalyticsTools(server, makeService() as any)

    const result = await handlers['fetch_engagement_summary']({
      from: '2026-05-01T00:00:00.000Z',
      to: '2026-05-31T23:59:59.000Z',
    })

    expect(result.isError).toBeFalsy()
    const data = parse(result)
    expect(data.period.from).toBe('2026-05-01T00:00:00.000Z')
    expect(data.period.to).toBe('2026-05-31T23:59:59.000Z')
  })

  it('sets platform to "all" when no platform filter provided', async () => {
    const { server, handlers } = createFakeServer()
    registerAnalyticsTools(server, makeService() as any)

    const result = await handlers['fetch_engagement_summary']({
      from: '2026-05-01T00:00:00.000Z',
      to: '2026-05-31T23:59:59.000Z',
    })

    expect(parse(result).platform).toBe('all')
  })

  it('uses the provided platform filter', async () => {
    const { server, handlers } = createFakeServer()
    registerAnalyticsTools(server, makeService() as any)

    const result = await handlers['fetch_engagement_summary']({
      from: '2026-05-01T00:00:00.000Z',
      to: '2026-05-31T23:59:59.000Z',
      platform: 'instagram',
    })

    expect(parse(result).platform).toBe('instagram')
  })

  it('includes recommendations array', async () => {
    const { server, handlers } = createFakeServer()
    registerAnalyticsTools(server, makeService() as any)

    const result = await handlers['fetch_engagement_summary']({
      from: '2026-05-01T00:00:00.000Z',
      to: '2026-05-31T23:59:59.000Z',
    })

    expect(parse(result).recommendations).toBeInstanceOf(Array)
    expect(parse(result).recommendations.length).toBeGreaterThan(0)
  })
})
