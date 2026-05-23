'use client'
import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Clock, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Activity {
  id: string
  type: 'published' | 'failed' | 'scheduled' | 'ai_generated'
  message: string
  timestamp: Date
}

const ICONS = {
  published: CheckCircle2,
  failed: XCircle,
  scheduled: Clock,
  ai_generated: Zap,
}

const COLORS = {
  published: 'text-status-success',
  failed: 'text-status-error',
  scheduled: 'text-ink-secondary',
  ai_generated: 'text-coral',
}

function formatRelative(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

function buildSeed(): Activity[] {
  const now = Date.now()
  return [
    { id: 'a1', type: 'published', message: 'LinkedIn post published successfully', timestamp: new Date(now - 4 * 60_000) },
    { id: 'a2', type: 'scheduled', message: 'Instagram post queued for 2:00 PM', timestamp: new Date(now - 12 * 60_000) },
    { id: 'a3', type: 'ai_generated', message: 'Claude generated 3 caption variants', timestamp: new Date(now - 25 * 60_000) },
    { id: 'a4', type: 'scheduled', message: 'Twitter thread queued for Thursday', timestamp: new Date(now - 48 * 60_000) },
    { id: 'a5', type: 'failed', message: 'Facebook post failed: rate limit hit', timestamp: new Date(now - 90 * 60_000) },
  ]
}

const SIMULATED: Omit<Activity, 'id' | 'timestamp'>[] = [
  { type: 'published', message: 'LinkedIn post published' },
  { type: 'scheduled', message: 'Instagram reel queued for tomorrow' },
  { type: 'ai_generated', message: 'Claude suggested optimal posting times' },
  { type: 'scheduled', message: 'Twitter post scheduled for 4 PM' },
]

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>(() => buildSeed())

  useEffect(() => {
    const t = setInterval(() => {
      const src = SIMULATED[Math.floor(Math.random() * SIMULATED.length)]
      setActivities((prev) => [
        { id: `sim-${Date.now()}`, ...src, timestamp: new Date() },
        ...prev.slice(0, 9),
      ])
    }, 12_000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="rounded-xl border border-edge-default bg-surface-raised flex flex-col overflow-hidden h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-edge-subtle shrink-0">
        <p className="text-[13px] font-medium text-ink-secondary">Activity</p>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-ink-disabled animate-pulse" />
          <span className="text-[11px] text-ink-disabled">Live</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {activities.map((a) => {
          const Icon = ICONS[a.type]
          return (
            <div key={a.id} className="flex items-start gap-3 px-5 py-3.5 border-b border-edge-subtle/40 last:border-0">
              <Icon className={cn('h-3.5 w-3.5 mt-px shrink-0', COLORS[a.type])} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-ink-secondary leading-snug">{a.message}</p>
                <p className="text-[11px] text-ink-disabled mt-0.5">{formatRelative(a.timestamp)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
