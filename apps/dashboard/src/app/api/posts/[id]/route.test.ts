import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Mock fetch (proxy to api-server) ─────────────────────────────────────────
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// ── Import after mocks ────────────────────────────────────────────────────────
const { DELETE } = await import('./route')

const BASE = 'http://localhost:3000/api/posts'

function makeReq(id: string) {
  return new NextRequest(`${BASE}/${id}`, { method: 'DELETE' })
}

describe('DELETE /api/posts/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: api-server returns success
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { deleted: 'post-1' } }),
    })
  })

  it('returns 200 with deleted id on success', async () => {
    const res = await DELETE(makeReq('post-1'), { params: { id: 'post-1' } })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.deleted).toBe('post-1')
  })

  it('forwards DELETE to api-server URL', async () => {
    await DELETE(makeReq('abc-123'), { params: { id: 'abc-123' } })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/posts/abc-123'),
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('returns 404 when api-server returns not found', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Post not found' }),
    })

    const res = await DELETE(makeReq('missing'), { params: { id: 'missing' } })
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBeTruthy()
  })

  it('returns 502 when api-server fetch throws (unreachable)', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'))

    const res = await DELETE(makeReq('any'), { params: { id: 'any' } })
    const body = await res.json()

    expect(res.status).toBe(502)
    expect(body.error).toMatch(/unreachable/i)
  })

  it('returns 502 when api-server returns unexpected error status', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal Server Error' }),
    })

    const res = await DELETE(makeReq('any'), { params: { id: 'any' } })

    expect(res.status).toBe(502)
  })
})
