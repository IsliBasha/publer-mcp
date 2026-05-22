import { describe, it, expect, vi } from 'vitest'
import { AccountsService } from './accounts.service.js'
import type { AxiosInstance } from 'axios'

function makeClient(overrides: Record<string, ReturnType<typeof vi.fn>> = {}): AxiosInstance {
  return { get: vi.fn(), ...overrides } as unknown as AxiosInstance
}

const ACCOUNTS = [
  { id: 'acc-1', provider: 'facebook', type: 'fb_page', name: 'FB Page', picture: null, locked: false, social_id: 'fb1' },
  { id: 'acc-2', provider: 'linkedin', type: 'linkedin_person', name: 'LinkedIn User', username: 'liuser', picture: 'https://example.com/pic.jpg', locked: false, social_id: 'li1' },
  { id: 'acc-3', provider: 'mastodon', type: 'mastodon', name: 'Mastodon', picture: null, locked: false, social_id: 'ms1' },
  { id: 'acc-4', provider: 'twitter', type: 'twitter', name: 'Twitter', picture: null, locked: true, social_id: 'tw1' },
]

describe('AccountsService.listAccounts', () => {
  it('returns only supported platforms, excluding mastodon', async () => {
    const get = vi.fn().mockResolvedValue({ data: ACCOUNTS })
    const service = new AccountsService(makeClient({ get }))

    const result = await service.listAccounts()

    const platforms = result.map((a) => a.platform)
    expect(platforms).not.toContain('mastodon')
    expect(platforms).toContain('facebook')
    expect(platforms).toContain('linkedin')
    expect(platforms).toContain('twitter')
  })

  it('marks locked accounts as disconnected', async () => {
    const get = vi.fn().mockResolvedValue({ data: ACCOUNTS })
    const service = new AccountsService(makeClient({ get }))

    const result = await service.listAccounts()
    const twitter = result.find((a) => a.platform === 'twitter')

    expect(twitter?.isConnected).toBe(false)
  })

  it('marks unlocked accounts as connected', async () => {
    const get = vi.fn().mockResolvedValue({ data: [ACCOUNTS[0]] })
    const service = new AccountsService(makeClient({ get }))

    const [account] = await service.listAccounts()

    expect(account.isConnected).toBe(true)
  })

  it('maps API fields to SocialAccount shape', async () => {
    const get = vi.fn().mockResolvedValue({ data: [ACCOUNTS[1]] })
    const service = new AccountsService(makeClient({ get }))

    const [account] = await service.listAccounts()

    expect(account).toMatchObject({
      id: 'acc-2',
      platform: 'linkedin',
      name: 'LinkedIn User',
      username: 'liuser',
      avatarUrl: 'https://example.com/pic.jpg',
      isConnected: true,
    })
  })

  it('falls back to account name when username is absent', async () => {
    const get = vi.fn().mockResolvedValue({ data: [ACCOUNTS[0]] })
    const service = new AccountsService(makeClient({ get }))

    const [account] = await service.listAccounts()

    expect(account.username).toBe('FB Page')
  })

  it('sets avatarUrl to undefined when picture is null', async () => {
    const get = vi.fn().mockResolvedValue({ data: [ACCOUNTS[0]] })
    const service = new AccountsService(makeClient({ get }))

    const [account] = await service.listAccounts()

    expect(account.avatarUrl).toBeUndefined()
  })
})
