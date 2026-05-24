import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComposeModal } from './ComposeModal'

// ── Mocks ─────────────────────────────────────────────────────────────────────
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function mockSuccess(post = { id: 'p1', content: 'Hello', platforms: ['instagram'], scheduledAt: '2026-06-01T10:00:00Z' }) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ success: true, data: post }),
  })
}

function mockError(message = 'Validation failed') {
  mockFetch.mockResolvedValue({
    ok: false,
    status: 400,
    json: () => Promise.resolve({ error: message }),
  })
}

describe('ComposeModal', () => {
  const onSuccess = vi.fn()
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Re-stub each test since afterEach could clear it
    vi.stubGlobal('fetch', mockFetch)
  })

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders nothing when open=false', () => {
    render(<ComposeModal open={false} onClose={onClose} onSuccess={onSuccess} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders the dialog when open=true', () => {
    render(<ComposeModal open onClose={onClose} onSuccess={onSuccess} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('renders the title "Schedule Post"', () => {
    render(<ComposeModal open onClose={onClose} onSuccess={onSuccess} />)
    expect(screen.getByRole('heading', { name: 'Schedule Post' })).toBeInTheDocument()
  })

  it('renders a content textarea', () => {
    render(<ComposeModal open onClose={onClose} onSuccess={onSuccess} />)
    expect(screen.getByRole('textbox', { name: /content/i })).toBeInTheDocument()
  })

  it('renders platform checkboxes including instagram', () => {
    render(<ComposeModal open onClose={onClose} onSuccess={onSuccess} />)
    expect(screen.getByRole('checkbox', { name: /instagram/i })).toBeInTheDocument()
  })

  it('renders a scheduled time input', () => {
    render(<ComposeModal open onClose={onClose} onSuccess={onSuccess} />)
    expect(screen.getByLabelText('Schedule for')).toBeInTheDocument()
  })

  it('calls onClose when cancel button clicked', async () => {
    render(<ComposeModal open onClose={onClose} onSuccess={onSuccess} />)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  // ── Validation ─────────────────────────────────────────────────────────────

  it('shows error when submitting with empty content', async () => {
    render(<ComposeModal open onClose={onClose} onSuccess={onSuccess} />)

    fireEvent.click(screen.getByRole('button', { name: /^schedule post$/i }))

    await waitFor(() => {
      expect(screen.getByText(/content is required/i)).toBeInTheDocument()
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('shows error when no platform selected', async () => {
    render(<ComposeModal open onClose={onClose} onSuccess={onSuccess} />)

    await userEvent.type(screen.getByRole('textbox', { name: /content/i }), 'Test post')
    fireEvent.click(screen.getByRole('button', { name: /^schedule post$/i }))

    await waitFor(() => {
      expect(screen.getByText(/select at least one platform/i)).toBeInTheDocument()
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  // ── Submission ─────────────────────────────────────────────────────────────

  it('calls POST /api/posts with correct payload', async () => {
    mockSuccess()
    render(<ComposeModal open onClose={onClose} onSuccess={onSuccess} />)

    await userEvent.type(screen.getByRole('textbox', { name: /content/i }), 'Hello Instagram!')
    fireEvent.click(screen.getByRole('checkbox', { name: /instagram/i }))
    fireEvent.change(screen.getByLabelText('Schedule for'), { target: { value: '2026-06-01T10:00' } })
    fireEvent.click(screen.getByRole('button', { name: /^schedule post$/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/posts',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: expect.stringContaining('Hello Instagram!'),
        })
      )
    })

    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(body.platforms).toContain('instagram')
    expect(body.scheduledAt).toBeTruthy()
  })

  it('calls onSuccess and onClose after successful submit', async () => {
    mockSuccess()
    render(<ComposeModal open onClose={onClose} onSuccess={onSuccess} />)

    await userEvent.type(screen.getByRole('textbox', { name: /content/i }), 'Test post')
    fireEvent.click(screen.getByRole('checkbox', { name: /instagram/i }))
    fireEvent.change(screen.getByLabelText('Schedule for'), { target: { value: '2026-06-01T10:00' } })
    fireEvent.click(screen.getByRole('button', { name: /^schedule post$/i }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce()
      expect(onClose).toHaveBeenCalledOnce()
    })
  })

  it('shows API error message when submit fails', async () => {
    mockError('Content exceeds platform limit')
    render(<ComposeModal open onClose={onClose} onSuccess={onSuccess} />)

    await userEvent.type(screen.getByRole('textbox', { name: /content/i }), 'Test post')
    fireEvent.click(screen.getByRole('checkbox', { name: /instagram/i }))
    fireEvent.change(screen.getByLabelText('Schedule for'), { target: { value: '2026-06-01T10:00' } })
    fireEvent.click(screen.getByRole('button', { name: /^schedule post$/i }))

    await waitFor(() => {
      expect(screen.getByText(/content exceeds platform limit/i)).toBeInTheDocument()
    })
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('disables submit button while submitting', async () => {
    let resolveFetch!: (v: unknown) => void
    mockFetch.mockReturnValue(new Promise((r) => { resolveFetch = r }))

    render(<ComposeModal open onClose={onClose} onSuccess={onSuccess} />)

    await userEvent.type(screen.getByRole('textbox', { name: /content/i }), 'Test post')
    fireEvent.click(screen.getByRole('checkbox', { name: /instagram/i }))
    fireEvent.change(screen.getByLabelText('Schedule for'), { target: { value: '2026-06-01T10:00' } })
    fireEvent.click(screen.getByRole('button', { name: /^schedule post$/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /scheduling/i })).toBeDisabled()
    })

    // Clean up pending promise
    resolveFetch({ ok: true, json: () => Promise.resolve({ success: true, data: {} }) })
  })
})
