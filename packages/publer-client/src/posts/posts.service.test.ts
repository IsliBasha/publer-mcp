import { describe, it, expect, vi } from 'vitest'
import { PostsService } from './posts.service.js'
import type { AxiosInstance } from 'axios'

function makeClient(overrides: Record<string, ReturnType<typeof vi.fn>> = {}): AxiosInstance {
  return { get: vi.fn(), patch: vi.fn(), ...overrides } as unknown as AxiosInstance
}

const API_POST = {
  id: 'post-1',
  text: 'Hello world',
  state: 'scheduled' as const,
  scheduled_at: '2026-05-24T10:00:00.000Z',
  published_at: null,
  account_id: 'acc-1',
  updated_at: '2026-05-23T00:00:00.000Z',
}

const API_ACCOUNT = {
  id: 'acc-1',
  provider: 'facebook',
  type: 'fb_page',
  name: 'Test Page',
  picture: null,
  locked: false,
  social_id: 'fb123',
}

function mockGet(posts: unknown[], total: unknown, accounts: unknown[] = []) {
  return vi.fn().mockImplementation((url: string) => {
    if (url === '/posts') return Promise.resolve({ data: { posts, total } })
    if (url === '/accounts') return Promise.resolve({ data: accounts })
    return Promise.reject(new Error(`unexpected GET ${url}`))
  })
}

describe('PostsService.listScheduledPosts', () => {
  it('strips page param from API call', async () => {
    const get = mockGet([], 0)
    const service = new PostsService(makeClient({ get }))

    await service.listScheduledPosts({ page: 2, limit: 10 })

    const postsCall = get.mock.calls.find((c) => c[0] === '/posts')
    expect(postsCall?.[1]?.params).not.toHaveProperty('page')
  })

  it('always sends state=scheduled filter', async () => {
    const get = mockGet([], 0)
    const service = new PostsService(makeClient({ get }))

    await service.listScheduledPosts({})

    const postsCall = get.mock.calls.find((c) => c[0] === '/posts')
    expect(postsCall?.[1]?.params).toMatchObject({ state: 'scheduled' })
  })

  it('returns 0 for total when API returns null', async () => {
    const get = mockGet([], null)
    const service = new PostsService(makeClient({ get }))

    const result = await service.listScheduledPosts({})

    expect(result.total).toBe(0)
  })

  it('populates platforms from account lookup', async () => {
    const get = mockGet([API_POST], 1, [API_ACCOUNT])
    const service = new PostsService(makeClient({ get }))

    const result = await service.listScheduledPosts({})

    expect(result.posts[0].platforms).toEqual(['facebook'])
  })

  it('returns empty platforms when account not found in cache', async () => {
    const get = mockGet([API_POST], 1, [])
    const service = new PostsService(makeClient({ get }))

    const result = await service.listScheduledPosts({})

    expect(result.posts[0].platforms).toEqual([])
  })

  it('filters posts by platform client-side after resolving from account cache', async () => {
    const twitterPost = { ...API_POST, id: 'p-tw', account_id: 'acc-tw' }
    const facebookPost = { ...API_POST, id: 'p-fb', account_id: 'acc-fb' }
    const accounts = [
      { ...API_ACCOUNT, id: 'acc-tw', provider: 'twitter' },
      { ...API_ACCOUNT, id: 'acc-fb', provider: 'facebook' },
    ]
    const get = mockGet([twitterPost, facebookPost], 2, accounts)
    const service = new PostsService(makeClient({ get }))

    const result = await service.listScheduledPosts({ platform: 'twitter' })

    expect(result.posts).toHaveLength(1)
    expect(result.posts[0].platforms).toEqual(['twitter'])
  })

  it('returns all posts when no platform filter is specified', async () => {
    const twitterPost = { ...API_POST, id: 'p-tw', account_id: 'acc-tw' }
    const facebookPost = { ...API_POST, id: 'p-fb', account_id: 'acc-fb' }
    const accounts = [
      { ...API_ACCOUNT, id: 'acc-tw', provider: 'twitter' },
      { ...API_ACCOUNT, id: 'acc-fb', provider: 'facebook' },
    ]
    const get = mockGet([twitterPost, facebookPost], 2, accounts)
    const service = new PostsService(makeClient({ get }))

    const result = await service.listScheduledPosts({})

    expect(result.posts).toHaveLength(2)
  })

  it('updates total to reflect filtered count', async () => {
    const twitterPost = { ...API_POST, id: 'p-tw', account_id: 'acc-tw' }
    const facebookPost = { ...API_POST, id: 'p-fb', account_id: 'acc-fb' }
    const accounts = [
      { ...API_ACCOUNT, id: 'acc-tw', provider: 'twitter' },
      { ...API_ACCOUNT, id: 'acc-fb', provider: 'facebook' },
    ]
    const get = mockGet([twitterPost, facebookPost], 2, accounts)
    const service = new PostsService(makeClient({ get }))

    const result = await service.listScheduledPosts({ platform: 'twitter' })

    expect(result.total).toBe(1)
  })

  it('caches account lookup — only one /accounts call across two listScheduledPosts calls', async () => {
    const get = mockGet([], 0)
    const service = new PostsService(makeClient({ get }))

    await service.listScheduledPosts({})
    await service.listScheduledPosts({})

    const accountCalls = get.mock.calls.filter((c) => c[0] === '/accounts')
    expect(accountCalls).toHaveLength(1)
  })

  it('maps post fields to ScheduledPost shape', async () => {
    const get = mockGet([API_POST], 1)
    const service = new PostsService(makeClient({ get }))

    const { posts } = await service.listScheduledPosts({})

    expect(posts[0]).toMatchObject({
      id: 'post-1',
      content: 'Hello world',
      status: 'scheduled',
      scheduledAt: '2026-05-24T10:00:00.000Z',
      accountIds: ['acc-1'],
    })
  })
})

describe('PostsService.createPost', () => {
  it('throws with API limitation message', async () => {
    const service = new PostsService(makeClient())
    await expect(service.createPost({} as any)).rejects.toThrow(
      'Publer API v1 does not support creating posts'
    )
  })
})

describe('PostsService.schedulePost', () => {
  it('throws with API limitation message', async () => {
    const service = new PostsService(makeClient())
    await expect(service.schedulePost({} as any)).rejects.toThrow(
      'Publer API v1 does not support scheduling posts'
    )
  })
})

describe('PostsService.deletePost', () => {
  it('throws with API limitation message', async () => {
    const service = new PostsService(makeClient())
    await expect(service.deletePost('id123')).rejects.toThrow(
      'Publer API v1 does not support deleting posts'
    )
  })
})

describe('PostsService.updateScheduledPost', () => {
  it('sends PATCH with mapped field names', async () => {
    const patch = vi.fn().mockResolvedValue({ data: { ...API_POST, text: 'updated' } })
    const get = mockGet([], 0)
    const service = new PostsService(makeClient({ patch, get }))

    await service.updateScheduledPost({
      id: 'post-1',
      content: 'updated',
      scheduledAt: '2026-05-24T10:00:00.000Z',
    })

    expect(patch).toHaveBeenCalledWith('/posts/post-1', {
      text: 'updated',
      scheduled_at: '2026-05-24T10:00:00.000Z',
    })
  })
})
