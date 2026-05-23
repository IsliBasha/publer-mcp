import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@publer-mcp/publer-client', () => ({
  createPublerServices: vi.fn(() => ({ accounts: {}, posts: {} })),
}))

describe('getPubServices', () => {
  beforeEach(() => {
    vi.resetModules()
    delete process.env.PUBLER_API_KEY
  })

  it('throws when PUBLER_API_KEY is not set', async () => {
    const { getPubServices } = await import('./publer.server')
    expect(() => getPubServices()).toThrow('PUBLER_API_KEY is not configured')
  })

  it('returns services when PUBLER_API_KEY is set', async () => {
    process.env.PUBLER_API_KEY = 'test-key'
    const { getPubServices } = await import('./publer.server')
    const services = getPubServices()
    expect(services).toBeDefined()
    expect(services).toHaveProperty('accounts')
    expect(services).toHaveProperty('posts')
  })

  it('returns the same instance on repeated calls (singleton)', async () => {
    process.env.PUBLER_API_KEY = 'test-key'
    const { getPubServices } = await import('./publer.server')
    expect(getPubServices()).toBe(getPubServices())
  })
})
