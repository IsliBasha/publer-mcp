import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockListPosts = vi.fn()
vi.mock('@/lib/publer.server', () => ({
  getPubServices: () => ({ posts: { listScheduledPosts: mockListPosts } }),
}))

const { GET } = await import('./route')

const BASE_URL = 'http://localhost:3000/api/posts'

function makeReq(params: Record<string, string> = {}) {
  const url = new URL(BASE_URL)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url.toString())
}

describe('GET /api/posts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns posts as JSON with 200', async () => {
    const mockResult = { posts: [{ id: 'p1', content: 'Hello', platforms: ['linkedin'] }], total: 1 }
    mockListPosts.mockResolvedValue(mockResult)

    const res = await GET(makeReq())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual(mockResult)
  })

  it('passes from, to, platform, and limit query params to the service', async () => {
    mockListPosts.mockResolvedValue({ posts: [], total: 0 })

    await GET(makeReq({ from: '2026-05-01T00:00:00Z', to: '2026-05-31T23:59:59Z', platform: 'twitter', limit: '10' }))

    expect(mockListPosts).toHaveBeenCalledWith({
      from: '2026-05-01T00:00:00Z',
      to: '2026-05-31T23:59:59Z',
      platform: 'twitter',
      limit: 10,
    })
  })

  it('passes undefined for absent optional params', async () => {
    mockListPosts.mockResolvedValue({ posts: [], total: 0 })

    await GET(makeReq())

    expect(mockListPosts).toHaveBeenCalledWith({
      from: undefined,
      to: undefined,
      platform: undefined,
      limit: undefined,
    })
  })

  it('returns 500 with error message when service throws', async () => {
    mockListPosts.mockRejectedValue(new Error('Timeout'))

    const res = await GET(makeReq())
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Timeout')
  })

  it('returns generic message for non-Error throws', async () => {
    mockListPosts.mockRejectedValue(42)

    const res = await GET(makeReq())
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Failed to fetch posts')
  })
})
