import { describe, it, expect, vi } from 'vitest'
import { AnalyticsService } from './analytics.service.js'
import type { AxiosInstance } from 'axios'

function makeClient(overrides: Record<string, ReturnType<typeof vi.fn>> = {}): AxiosInstance {
  return { get: vi.fn(), ...overrides } as unknown as AxiosInstance
}

const API_ACCOUNT = {
  id: 'acc-1',
  provider: 'linkedin',
  type: 'linkedin_person',
  name: 'Test User',
  username: 'testuser',
  picture: 'https://example.com/pic.jpg',
  locked: false,
  social_id: 'li123',
}

const API_POST = {
  id: 'post-1',
  text: 'Test post content',
  state: 'scheduled' as const,
  scheduled_at: '2026-05-24T10:00:00.000Z',
  published_at: null,
  account_id: 'acc-1',
  updated_at: '2026-05-23T00:00:00.000Z',
}

describe('AnalyticsService.getFollowers', () => {
  it('returns metrics derived from /accounts', async () => {
    const get = vi.fn().mockResolvedValue({ data: [API_ACCOUNT] })
    const service = new AnalyticsService(makeClient({ get }))

    const result = await service.getFollowers()

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      platform: 'linkedin',
      accountId: 'acc-1',
      accountName: 'Test User',
      followers: 0,
    })
  })

  it('filters by accountId when provided', async () => {
    const get = vi.fn().mockResolvedValue({
      data: [API_ACCOUNT, { ...API_ACCOUNT, id: 'acc-2', provider: 'twitter' }],
    })
    const service = new AnalyticsService(makeClient({ get }))

    const result = await service.getFollowers('acc-1')

    expect(result).toHaveLength(1)
    expect(result[0].accountId).toBe('acc-1')
  })

  it('excludes unsupported platforms like mastodon', async () => {
    const get = vi.fn().mockResolvedValue({
      data: [API_ACCOUNT, { ...API_ACCOUNT, id: 'acc-m', provider: 'mastodon' }],
    })
    const service = new AnalyticsService(makeClient({ get }))

    const result = await service.getFollowers()

    expect(result.map((r) => r.platform as string)).not.toContain('mastodon')
  })
})

describe('AnalyticsService.getPostAnalytics', () => {
  it('fetches real post content from /posts/:id', async () => {
    const get = vi.fn().mockResolvedValue({ data: API_POST })
    const service = new AnalyticsService(makeClient({ get }))

    const result = await service.getPostAnalytics('post-1')

    expect(get).toHaveBeenCalledWith('/posts/post-1')
    expect(result.content).toBe('Test post content')
    expect(result.postId).toBe('post-1')
  })

  it('returns zero engagement metrics (no analytics API in v1)', async () => {
    const get = vi.fn().mockResolvedValue({ data: API_POST })
    const service = new AnalyticsService(makeClient({ get }))

    const result = await service.getPostAnalytics('post-1')

    expect(result.metrics.likes).toBe(0)
    expect(result.metrics.engagementRate).toBe(0)
    expect(result.metrics.impressions).toBe(0)
  })

  it('uses scheduled_at as publishedAt when available', async () => {
    const get = vi.fn().mockResolvedValue({ data: API_POST })
    const service = new AnalyticsService(makeClient({ get }))

    const result = await service.getPostAnalytics('post-1')

    expect(result.publishedAt).toBe('2026-05-24T10:00:00.000Z')
  })
})

describe('AnalyticsService.getBestPostingTime', () => {
  it('returns recommendations for a known platform', async () => {
    const service = new AnalyticsService(makeClient())

    const result = await service.getBestPostingTime('linkedin')

    expect(result.platform).toBe('linkedin')
    expect(result.recommendations.length).toBeGreaterThan(0)
    expect(result.recommendations[0]).toHaveProperty('dayOfWeek')
    expect(result.recommendations[0]).toHaveProperty('hour')
    expect(result.recommendations[0]).toHaveProperty('confidence')
    expect(result.recommendations[0]).toHaveProperty('expectedEngagementBoost')
  })

  it('falls back to facebook times for an unknown platform', async () => {
    const service = new AnalyticsService(makeClient())
    const facebook = await service.getBestPostingTime('facebook')
    const unknown = await service.getBestPostingTime('myspace' as any)

    expect(unknown.recommendations).toEqual(facebook.recommendations)
  })

  it('includes platform name in reasoning', async () => {
    const service = new AnalyticsService(makeClient())

    const result = await service.getBestPostingTime('instagram')

    expect(result.reasoning).toContain('instagram')
  })

  it('returns correct platform field', async () => {
    const service = new AnalyticsService(makeClient())

    const result = await service.getBestPostingTime('tiktok')

    expect(result.platform).toBe('tiktok')
  })
})
