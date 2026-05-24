/**
 * Tests for POST /api/posts — proxy to api-server /api/posts/schedule.
 * Kept in a separate file to avoid module-level mock conflicts with the
 * existing GET tests (which mock @/lib/publer.server).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Mock fetch (proxy to api-server) ─────────────────────────────────────────
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Import after global mock is set
const { POST } = await import('./route')

const BASE = 'http://localhost:3000/api/posts'

function makeReq(body: unknown) {
  return new NextRequest(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validBody = {
  content: 'Hello from the dashboard!',
  platforms: ['instagram'],
  scheduledAt: '2026-06-01T10:00:00.000Z',
}

describe('POST /api/posts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ success: true, data: { id: 'new-post-1', ...validBody } }),
    })
  })

  it('returns 201 with created post on success', async () => {
    const res = await POST(makeReq(validBody))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.id).toBe('new-post-1')
  })

  it('forwards request to api-server /api/posts/schedule', async () => {
    await POST(makeReq(validBody))

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/posts/schedule'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      })
    )
  })

  it('forwards content, platforms, and scheduledAt in the body', async () => {
    await POST(makeReq(validBody))

    const sentBody = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(sentBody.content).toBe('Hello from the dashboard!')
    expect(sentBody.platforms).toEqual(['instagram'])
    expect(sentBody.scheduledAt).toBe('2026-06-01T10:00:00.000Z')
  })

  it('returns 400 when content is missing', async () => {
    const res = await POST(makeReq({ platforms: ['instagram'], scheduledAt: '2026-06-01T10:00:00.000Z' }))
    expect(res.status).toBe(400)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns 400 when platforms array is empty', async () => {
    const res = await POST(makeReq({ content: 'hi', platforms: [], scheduledAt: '2026-06-01T10:00:00.000Z' }))
    expect(res.status).toBe(400)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns 400 when scheduledAt is missing', async () => {
    const res = await POST(makeReq({ content: 'hi', platforms: ['instagram'] }))
    expect(res.status).toBe(400)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns 400 when scheduledAt is not a valid datetime', async () => {
    const res = await POST(makeReq({ content: 'hi', platforms: ['instagram'], scheduledAt: 'not-a-date' }))
    expect(res.status).toBe(400)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns 502 when api-server is unreachable', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'))

    const res = await POST(makeReq(validBody))
    const body = await res.json()

    expect(res.status).toBe(502)
    expect(body.error).toMatch(/unreachable/i)
  })

  it('returns 502 when api-server returns 500', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'DB error' }),
    })

    const res = await POST(makeReq(validBody))
    expect(res.status).toBe(502)
  })
})
