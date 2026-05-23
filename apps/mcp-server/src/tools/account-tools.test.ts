import { describe, it, expect, vi } from 'vitest'
import { registerAccountTools } from './account-tools.js'

type Handler = (params: Record<string, unknown>) => Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }>

function createFakeServer() {
  const handlers: Record<string, Handler> = {}
  const server = {
    tool: (name: string, _desc: string, _schema: unknown, handler: Handler) => {
      handlers[name] = handler
    },
  }
  return { server: server as any, handlers }
}

function parse(result: { content: Array<{ type: string; text: string }> }) {
  return JSON.parse(result.content[0].text)
}

const FAKE_ACCOUNTS = [
  { id: 'acc-1', platform: 'linkedin', name: 'Test Co', username: 'testco', status: 'connected' },
  { id: 'acc-2', platform: 'twitter', name: 'Test Co', username: 'testco_tw', status: 'connected' },
  { id: 'acc-3', platform: 'linkedin', name: 'Test Co 2', username: 'testco2', status: 'connected' },
]

describe('list_social_accounts', () => {
  it('returns accounts with total count', async () => {
    const { server, handlers } = createFakeServer()
    const service = { listAccounts: vi.fn().mockResolvedValue(FAKE_ACCOUNTS) }
    registerAccountTools(server, service as any)

    const result = await handlers['list_social_accounts']({})

    expect(result.isError).toBeFalsy()
    const data = parse(result)
    expect(data.accounts).toHaveLength(3)
    expect(data.total).toBe(3)
  })

  it('returns deduplicated list of platforms', async () => {
    const { server, handlers } = createFakeServer()
    const service = { listAccounts: vi.fn().mockResolvedValue(FAKE_ACCOUNTS) }
    registerAccountTools(server, service as any)

    const result = await handlers['list_social_accounts']({})

    const data = parse(result)
    expect(data.platforms).toEqual(expect.arrayContaining(['linkedin', 'twitter']))
    expect(data.platforms).toHaveLength(2)
  })

  it('returns errorResponse when listAccounts throws', async () => {
    const { server, handlers } = createFakeServer()
    const service = { listAccounts: vi.fn().mockRejectedValue(new Error('unauthorized')) }
    registerAccountTools(server, service as any)

    const result = await handlers['list_social_accounts']({})

    expect(result.isError).toBe(true)
    expect(parse(result).error).toBe('unauthorized')
  })

  it('returns empty accounts and platforms when workspace has none', async () => {
    const { server, handlers } = createFakeServer()
    const service = { listAccounts: vi.fn().mockResolvedValue([]) }
    registerAccountTools(server, service as any)

    const result = await handlers['list_social_accounts']({})

    const data = parse(result)
    expect(data.accounts).toHaveLength(0)
    expect(data.total).toBe(0)
    expect(data.platforms).toHaveLength(0)
  })
})
