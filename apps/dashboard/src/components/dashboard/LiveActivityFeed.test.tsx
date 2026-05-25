import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { LiveActivityFeed } from './LiveActivityFeed'

function mockFetch(posts: unknown[], ok = true) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve({ posts, total: posts.length }),
  }))
}

function makePost(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    content: 'Test post',
    platforms: ['linkedin'],
    scheduledAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    status: 'published',
    accountIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('LiveActivityFeed', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the Activity header', () => {
    mockFetch([])
    render(<LiveActivityFeed />)
    expect(screen.getByText('Activity')).toBeInTheDocument()
  })

  it('renders the Live indicator', () => {
    mockFetch([])
    render(<LiveActivityFeed />)
    expect(screen.getByText('Live')).toBeInTheDocument()
  })

  it('fetches from /api/posts on mount', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ posts: [], total: 0 }),
    })
    vi.stubGlobal('fetch', fetchMock)
    render(<LiveActivityFeed />)
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/posts?limit=5')
    })
  })

  it('shows empty state when API returns no posts', async () => {
    mockFetch([])
    render(<LiveActivityFeed />)
    await waitFor(() => {
      expect(screen.getByText('No recent activity')).toBeInTheDocument()
    })
  })

  it('shows empty state on API error', async () => {
    mockFetch([], false)
    render(<LiveActivityFeed />)
    await waitFor(() => {
      expect(screen.getByText('No recent activity')).toBeInTheDocument()
    })
  })

  it('renders a published post activity', async () => {
    mockFetch([makePost({ status: 'published', platforms: ['linkedin'] })])
    render(<LiveActivityFeed />)
    await waitFor(() => {
      expect(screen.getByText('linkedin post published')).toBeInTheDocument()
    })
  })

  it('renders a failed post activity', async () => {
    mockFetch([makePost({ status: 'failed', platforms: ['instagram'] })])
    render(<LiveActivityFeed />)
    await waitFor(() => {
      expect(screen.getByText('instagram post failed')).toBeInTheDocument()
    })
  })

  it('renders a scheduled post activity', async () => {
    mockFetch([makePost({ status: 'scheduled', platforms: ['twitter'] })])
    render(<LiveActivityFeed />)
    await waitFor(() => {
      expect(screen.getByText('twitter post scheduled')).toBeInTheDocument()
    })
  })

  it('does not render hardcoded seed messages', async () => {
    mockFetch([])
    render(<LiveActivityFeed />)
    await waitFor(() => {
      expect(screen.queryByText('LinkedIn post published successfully')).not.toBeInTheDocument()
      expect(screen.queryByText('Facebook post failed: rate limit hit')).not.toBeInTheDocument()
    })
  })
})
