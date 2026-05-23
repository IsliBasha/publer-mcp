import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockListAccounts = vi.fn()
vi.mock('@/lib/publer.server', () => ({
  getPubServices: () => ({ accounts: { listAccounts: mockListAccounts } }),
}))

const { GET } = await import('./route')

describe('GET /api/accounts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns accounts as JSON with 200', async () => {
    const mockAccounts = [
      { id: 'acc-1', platform: 'linkedin', name: 'Test Co', username: 'testco',
        workspaceId: 'ws-1', isConnected: true, connectedAt: '2026-01-01T00:00:00Z' },
    ]
    mockListAccounts.mockResolvedValue(mockAccounts)

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual(mockAccounts)
  })

  it('returns 500 with error message when service throws', async () => {
    mockListAccounts.mockRejectedValue(new Error('Network failure'))

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Network failure')
  })

  it('returns generic message for non-Error throws', async () => {
    mockListAccounts.mockRejectedValue('string error')

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Failed to fetch accounts')
  })
})
