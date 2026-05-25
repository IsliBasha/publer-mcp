import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ToolCallCard } from './ToolCallCard'
import type { ToolCall } from '@/types/chat'

function makeToolCall(overrides: Partial<ToolCall> = {}): ToolCall {
  return {
    id: 'tc-1',
    tool: 'list_social_accounts',
    params: { limit: 10 },
    status: 'done',
    result: { accounts: [], total: 0 },
    duration: 312,
    startedAt: new Date(),
    ...overrides,
  }
}

describe('ToolCallCard', () => {
  it('renders the tool name', () => {
    render(<ToolCallCard toolCall={makeToolCall()} />)
    expect(screen.getByText('list_social_accounts')).toBeInTheDocument()
  })

  it('shows duration when provided', () => {
    render(<ToolCallCard toolCall={makeToolCall({ duration: 512 })} />)
    expect(screen.getByText('512ms')).toBeInTheDocument()
  })

  it('does not show duration when absent', () => {
    render(<ToolCallCard toolCall={makeToolCall({ duration: undefined })} />)
    expect(screen.queryByText(/ms/)).not.toBeInTheDocument()
  })

  it('shows the expand/collapse button as collapsed by default', () => {
    render(<ToolCallCard toolCall={makeToolCall()} />)
    expect(screen.queryByText('Input')).not.toBeInTheDocument()
  })

  it('expands to show params when clicked', () => {
    render(<ToolCallCard toolCall={makeToolCall()} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Input')).toBeInTheDocument()
    expect(screen.getByText('Output')).toBeInTheDocument()
  })

  it('collapses again on second click', () => {
    render(<ToolCallCard toolCall={makeToolCall()} />)
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    fireEvent.click(btn)
    expect(screen.queryByText('Input')).not.toBeInTheDocument()
  })

  it('shows error section when errorMessage is set', () => {
    render(<ToolCallCard toolCall={makeToolCall({ status: 'error', errorMessage: 'timeout' })} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('timeout')).toBeInTheDocument()
  })

  it('does not show Output section when result is undefined', () => {
    render(<ToolCallCard toolCall={makeToolCall({ result: undefined })} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByText('Output')).not.toBeInTheDocument()
  })

  // ── New behaviour ────────────────────────────────────────────────────────────

  it('auto-expands when status is running', () => {
    render(<ToolCallCard toolCall={makeToolCall({ status: 'running', result: undefined, duration: undefined })} />)
    // Must be expanded without any user interaction
    expect(screen.getByText('Input')).toBeInTheDocument()
  })

  it('renders params as key-value pairs in the expanded Input section', () => {
    render(<ToolCallCard toolCall={makeToolCall({ params: { platform: 'linkedin', content: 'hello' } })} />)
    fireEvent.click(screen.getByRole('button', { name: /list_social_accounts/i }))
    expect(screen.getByText('platform')).toBeInTheDocument()
    expect(screen.getByText('linkedin')).toBeInTheDocument()
    expect(screen.getByText('content')).toBeInTheDocument()
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('shows a copy button when expanded and result is present', () => {
    render(<ToolCallCard toolCall={makeToolCall({ result: { accounts: [] } })} />)
    fireEvent.click(screen.getByRole('button', { name: /list_social_accounts/i }))
    expect(screen.getByTitle('Copy result')).toBeInTheDocument()
  })

  it('does not show copy button when result is absent', () => {
    render(<ToolCallCard toolCall={makeToolCall({ result: undefined })} />)
    fireEvent.click(screen.getByRole('button', { name: /list_social_accounts/i }))
    expect(screen.queryByTitle('Copy result')).not.toBeInTheDocument()
  })
})
