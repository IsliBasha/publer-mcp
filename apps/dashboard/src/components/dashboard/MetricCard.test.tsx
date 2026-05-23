import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Users } from 'lucide-react'
import { MetricCard } from './MetricCard'

describe('MetricCard', () => {
  it('renders the title and formatted value', () => {
    render(<MetricCard title="Scheduled Posts" value={14} icon={Users} />)
    expect(screen.getByText('Scheduled Posts')).toBeInTheDocument()
    expect(screen.getByText('14')).toBeInTheDocument()
  })

  it('formats large values with K suffix', () => {
    render(<MetricCard title="Followers" value={48_320} icon={Users} />)
    expect(screen.getByText('48.3K')).toBeInTheDocument()
  })

  it('does not render a change line when change is undefined', () => {
    render(<MetricCard title="Posts" value={5} icon={Users} />)
    expect(screen.queryByText(/vs last period/)).not.toBeInTheDocument()
  })

  it('renders positive change in green with + prefix', () => {
    render(<MetricCard title="Reach" value={1000} change={3.2} icon={Users} />)
    const change = screen.getByText('+3.2% vs last period')
    expect(change).toBeInTheDocument()
    expect(change).toHaveClass('text-status-success')
  })

  it('renders negative change in red without double-minus', () => {
    render(<MetricCard title="Clicks" value={500} change={-2.1} icon={Users} />)
    const change = screen.getByText('-2.1% vs last period')
    expect(change).toBeInTheDocument()
    expect(change).toHaveClass('text-status-error')
  })
})
