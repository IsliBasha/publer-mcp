import '@testing-library/jest-dom'
import { vi } from 'vitest'

// ── socket.io-client mock ─────────────────────────────────────────────────────
// Prevents actual TCP connections in JSDOM tests.
// Components that use useSocket get an inert socket that never fires events,
// keeping connected = false throughout tests. Tests that need specific socket
// behaviour mock useSocket or useRealtimeActivity at the module level.
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  })),
}))

// ── ResizeObserver stub ───────────────────────────────────────────────────────
// Required by recharts (EngagementChart) which calls ResizeObserver internally.
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
