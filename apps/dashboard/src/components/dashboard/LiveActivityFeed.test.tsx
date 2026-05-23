import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { LiveActivityFeed } from './LiveActivityFeed'

describe('LiveActivityFeed', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the Activity header', () => {
    render(<LiveActivityFeed />)
    expect(screen.getByText('Activity')).toBeInTheDocument()
  })

  it('renders the Live indicator', () => {
    render(<LiveActivityFeed />)
    expect(screen.getByText('Live')).toBeInTheDocument()
  })

  it('renders the seed activity messages on mount', () => {
    render(<LiveActivityFeed />)
    expect(screen.getByText('LinkedIn post published successfully')).toBeInTheDocument()
    expect(screen.getByText('Facebook post failed: rate limit hit')).toBeInTheDocument()
  })

  it('shows relative timestamps for seed entries', () => {
    render(<LiveActivityFeed />)
    expect(screen.getByText('4m ago')).toBeInTheDocument()
  })

  it('injects a simulated event after 12 seconds', () => {
    render(<LiveActivityFeed />)
    act(() => {
      vi.advanceTimersByTime(12_000)
    })
    const simMessages = [
      'LinkedIn post published',
      'Instagram reel queued for tomorrow',
      'Claude suggested optimal posting times',
      'Twitter post scheduled for 4 PM',
    ]
    const found = simMessages.some((msg) => !!screen.queryByText(msg))
    expect(found).toBe(true)
  })
})
