import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Mock the Publer services ──────────────────────────────────────────────────

const mockGetFollowers = vi.fn()
const mockListScheduledPosts = vi.fn()

vi.mock('@/lib/publer.server', () => ({
  getPubServices: () => ({
    analytics: { getFollowers: mockGetFollowers },
    posts: { listScheduledPosts: mockListScheduledPosts },
  }),
}))

const { GET } = await import('./route')

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000).toISOString()
}

function makePost(overrides: Partial<{
  id: string
  platforms: string[]
  scheduledAt: string
  status: string
}> = {}) {
  return {
    id: 'p1',
    content: 'Test',
    platforms: ['linkedin'],
    scheduledAt: daysAgo(2),
    status: 'scheduled',
    accountIds: [],
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

function makeFollower(overrides: Partial<{
  platform: string
  followers: number
  growthThisWeek: number
  growthPercent: number
}> = {}) {
  return {
    platform: 'linkedin',
    accountId: 'a1',
    accountName: 'Test',
    followers: 5000,
    following: 100,
    growthThisWeek: 200,
    growthPercent: 4.2,
    historicalData: [],
    ...overrides,
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetFollowers.mockResolvedValue([
      makeFollower({ platform: 'linkedin', followers: 5000, growthThisWeek: 200, growthPercent: 4.2 }),
      makeFollower({ platform: 'instagram', followers: 12000, growthThisWeek: 400, growthPercent: 3.4 }),
    ])
    mockListScheduledPosts.mockResolvedValue({
      posts: [
        makePost({ id: 'p1', platforms: ['linkedin'], scheduledAt: daysAgo(2), status: 'published' }),
        makePost({ id: 'p2', platforms: ['instagram'], scheduledAt: daysAgo(1), status: 'scheduled' }),
        makePost({ id: 'p3', platforms: ['twitter'], scheduledAt: daysAgo(10), status: 'published' }),
      ],
      total: 3,
    })
  })

  it('returns 200 with success flag', async () => {
    const res = await GET(new NextRequest('http://localhost/api/analytics'))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('returns totalFollowers as sum of all follower counts', async () => {
    const res = await GET(new NextRequest('http://localhost/api/analytics'))
    const body = await res.json()
    expect(body.data.totalFollowers).toBe(17_000)
  })

  it('returns weeklyGrowth as sum of all growthThisWeek values', async () => {
    const res = await GET(new NextRequest('http://localhost/api/analytics'))
    const body = await res.json()
    expect(body.data.weeklyGrowth).toBe(600)
  })

  it('returns chartData as an array of exactly 7 entries', async () => {
    const res = await GET(new NextRequest('http://localhost/api/analytics'))
    const body = await res.json()
    expect(Array.isArray(body.data.chartData)).toBe(true)
    expect(body.data.chartData).toHaveLength(7)
  })

  it('every chartData entry contains a string date field', async () => {
    const res = await GET(new NextRequest('http://localhost/api/analytics'))
    const body = await res.json()
    const allHaveDates = body.data.chartData.every(
      (d: Record<string, unknown>) => typeof d.date === 'string'
    )
    expect(allHaveDates).toBe(true)
  })

  it('returns platformsActive as count of unique platforms in followers list', async () => {
    const res = await GET(new NextRequest('http://localhost/api/analytics'))
    const body = await res.json()
    expect(body.data.platformsActive).toBe(2)
  })

  it('returns scheduledCount counting only scheduled-status posts', async () => {
    const res = await GET(new NextRequest('http://localhost/api/analytics'))
    const body = await res.json()
    expect(body.data.scheduledCount).toBe(1)
  })

  it('returns publishedThisWeek only for published posts within 7 days', async () => {
    // p1 (linkedin, 2 days ago, published) → counted
    // p2 (instagram, 1 day ago, scheduled) → not counted (not published)
    // p3 (twitter, 10 days ago, published) → not counted (too old)
    const res = await GET(new NextRequest('http://localhost/api/analytics'))
    const body = await res.json()
    expect(body.data.publishedThisWeek).toBe(1)
  })

  it('returns 500 with error message when a service throws', async () => {
    mockGetFollowers.mockRejectedValue(new Error('timeout'))
    const res = await GET(new NextRequest('http://localhost/api/analytics'))
    const body = await res.json()
    expect(res.status).toBe(500)
    expect(body.error).toBe('timeout')
  })

  it('returns generic message for non-Error throws', async () => {
    mockGetFollowers.mockRejectedValue('string error')
    const res = await GET(new NextRequest('http://localhost/api/analytics'))
    const body = await res.json()
    expect(res.status).toBe(500)
    expect(body.error).toBe('Failed to fetch analytics')
  })
})
