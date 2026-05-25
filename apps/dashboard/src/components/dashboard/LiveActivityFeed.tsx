'use client'
import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Clock, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRealtimeActivity, type Activity } from '@/hooks/useRealtimeActivity'
import type { ScheduledPost } from '@publer-mcp/shared-types'

const ICONS = {
  published: CheckCircle2,
  failed: XCircle,
  scheduled: Clock,
}

const COLORS = {
  published: 'text-status-success',
  failed: 'text-status-error',
  scheduled: 'text-ink-secondary',
}

function formatRelative(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

function postToActivity(post: ScheduledPost): Activity | null {
  const platform = post.platforms[0]
  if (!platform) return null
  if (post.status === 'published') {
    return { id: post.id, type: 'published', message: `${platform} post published`, timestamp: new Date(post.updatedAt) }
  }
  if (post.status === 'failed') {
    return { id: post.id, type: 'failed', message: `${platform} post failed`, timestamp: new Date(post.updatedAt) }
  }
  if (post.status === 'scheduled') {
    return { id: post.id, type: 'scheduled', message: `${platform} post scheduled`, timestamp: new Date(post.scheduledAt) }
  }
  return null
}

export function LiveActivityFeed() {
  const [initialActivities, setInitialActivities] = useState<Activity[]>([])

  // Seed from recent posts on mount; WebSocket prepends new events on top
  useEffect(() => {
    fetch('/api/posts?limit=5')
      .then((res) => {
        if (!res.ok) return { posts: [] }
        return res.json() as Promise<{ posts: ScheduledPost[] }>
      })
      .then(({ posts }) => {
        const mapped = posts.flatMap((p) => {
          const a = postToActivity(p)
          return a ? [a] : []
        })
        setInitialActivities(mapped)
      })
      .catch(() => setInitialActivities([]))
  }, [])

  const { activities, connected } = useRealtimeActivity(initialActivities)

  return (
    <div className="rounded-xl border border-edge-default bg-surface-raised flex flex-col overflow-hidden h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-edge-subtle shrink-0">
        <p className="text-[13px] font-medium text-ink-secondary">Activity</p>
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              'h-1.5 w-1.5 rounded-full animate-pulse',
              connected ? 'bg-status-success' : 'bg-ink-disabled'
            )}
          />
          <span className={cn('text-[11px]', connected ? 'text-status-success' : 'text-ink-disabled')}>
            Live
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-10 gap-2">
            <Inbox className="h-5 w-5 text-ink-disabled" />
            <p className="text-[12px] text-ink-disabled">No recent activity</p>
          </div>
        ) : (
          activities.map((a) => {
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
          })
        )}
      </div>
    </div>
  )
}
