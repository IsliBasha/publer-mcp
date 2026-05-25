import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRealtimeActivity, type Activity } from './useRealtimeActivity'

// ── Socket mock wiring ────────────────────────────────────────────────────────

type MockSocket = {
  on: ReturnType<typeof vi.fn>
  off: ReturnType<typeof vi.fn>
}

const handlers: Record<string, ((...args: unknown[]) => void)[]> = {}
let mockSocket: MockSocket | null = null

vi.mock('./useSocket', () => ({
  useSocket: () => ({ socket: mockSocket, connected: mockSocket !== null }),
}))

function createSocket(): MockSocket {
  return {
    on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      handlers[event] ??= []
      handlers[event].push(cb)
    }),
    off: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      handlers[event] = (handlers[event] ?? []).filter((h) => h !== cb)
    }),
  }
}

function emit(event: string, data: unknown) {
  ;(handlers[event] ?? []).forEach((cb) => cb(data))
}

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'act-1',
    type: 'published',
    message: 'linkedin post published',
    timestamp: new Date(),
    ...overrides,
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useRealtimeActivity', () => {
  afterEach(() => {
    mockSocket = null
    Object.keys(handlers).forEach((k) => delete handlers[k])
    vi.clearAllMocks()
  })

  it('returns initial activities when socket is null', () => {
    mockSocket = null
    const initial = [makeActivity()]
    const { result } = renderHook(() => useRealtimeActivity(initial))
    expect(result.current.activities).toHaveLength(1)
    expect(result.current.activities[0].id).toBe('act-1')
  })

  it('reports connected:false when socket is null', () => {
    mockSocket = null
    const { result } = renderHook(() => useRealtimeActivity([]))
    expect(result.current.connected).toBe(false)
  })

  it('prepends a published event as a new activity', () => {
    mockSocket = createSocket()
    const { result } = renderHook(() => useRealtimeActivity([]))

    act(() => {
      emit('post:published', { postId: 'p1', platforms: ['linkedin'] })
    })

    expect(result.current.activities).toHaveLength(1)
    expect(result.current.activities[0].type).toBe('published')
    expect(result.current.activities[0].message).toBe('linkedin post published')
    expect(result.current.activities[0].id).toBe('p1')
  })

  it('prepends a failed event as a new activity', () => {
    mockSocket = createSocket()
    const { result } = renderHook(() => useRealtimeActivity([]))

    act(() => {
      emit('post:failed', { postId: 'p2', platforms: ['instagram'], error: 'timeout' })
    })

    expect(result.current.activities).toHaveLength(1)
    expect(result.current.activities[0].type).toBe('failed')
    expect(result.current.activities[0].message).toBe('instagram post failed')
    expect(result.current.activities[0].id).toBe('p2')
  })

  it('socket activities appear before initial activities', () => {
    mockSocket = createSocket()
    const initial = [makeActivity({ id: 'old-1', timestamp: new Date(Date.now() - 5000) })]
    const { result } = renderHook(() => useRealtimeActivity(initial))

    act(() => {
      emit('post:published', { postId: 'new-1', platforms: ['twitter'] })
    })

    expect(result.current.activities[0].id).toBe('new-1')
    expect(result.current.activities[1].id).toBe('old-1')
  })

  it('uses the first platform in the array for the activity message', () => {
    mockSocket = createSocket()
    const { result } = renderHook(() => useRealtimeActivity([]))

    act(() => {
      emit('post:published', { postId: 'p3', platforms: ['facebook', 'twitter'] })
    })

    expect(result.current.activities[0].message).toBe('facebook post published')
  })

  it('caps combined activity list at 10 entries', () => {
    mockSocket = createSocket()
    const initial = Array.from({ length: 8 }, (_, i) =>
      makeActivity({ id: `init-${i}`, timestamp: new Date(Date.now() - i * 1000) })
    )
    const { result } = renderHook(() => useRealtimeActivity(initial))

    act(() => {
      emit('post:published', { postId: 'new-1', platforms: ['linkedin'] })
      emit('post:published', { postId: 'new-2', platforms: ['twitter'] })
      emit('post:published', { postId: 'new-3', platforms: ['instagram'] })
    })

    expect(result.current.activities.length).toBeLessThanOrEqual(10)
  })

  it('handles a failed event without platforms gracefully', () => {
    mockSocket = createSocket()
    const { result } = renderHook(() => useRealtimeActivity([]))

    act(() => {
      emit('post:failed', { error: 'network error' })
    })

    expect(result.current.activities[0].type).toBe('failed')
    expect(result.current.activities[0].message).toBe('unknown post failed')
  })
})
