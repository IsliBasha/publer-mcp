import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAccounts } from './useAccounts'

function mockFetch(data: unknown, ok = true) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(data),
  }))
}

describe('useAccounts', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns empty array initially', () => {
    mockFetch([])
    const { result } = renderHook(() => useAccounts())
    expect(result.current).toEqual([])
  })

  it('fetches from /api/accounts on mount', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })
    vi.stubGlobal('fetch', fetchMock)
    renderHook(() => useAccounts())
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/accounts')
    })
  })

  it('returns accounts from API response', async () => {
    const accounts = [
      {
        id: 'acc-1',
        platform: 'linkedin',
        name: 'Test User',
        username: 'testuser',
        workspaceId: 'ws-1',
        isConnected: true,
        connectedAt: '2026-01-01T00:00:00Z',
      },
    ]
    mockFetch(accounts)
    const { result } = renderHook(() => useAccounts())
    await waitFor(() => {
      expect(result.current).toEqual(accounts)
    })
  })

  it('returns empty array when response is not ok', async () => {
    mockFetch({ error: 'Unauthorized' }, false)
    const { result } = renderHook(() => useAccounts())
    await waitFor(() => {
      expect(result.current).toEqual([])
    })
  })

  it('returns empty array when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const { result } = renderHook(() => useAccounts())
    await waitFor(() => {
      expect(result.current).toEqual([])
    })
  })
})
