import { Sidebar } from '@/components/dashboard/Sidebar'
import { CheckCircle2, XCircle, Clock, Loader2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPubServices } from '@/lib/publer.server'
import type { ScheduledPost } from '@publer-mcp/shared-types'

type QueueStatus = 'waiting' | 'active' | 'delayed' | 'completed' | 'failed'

function toQueueStatus(postStatus: ScheduledPost['status']): QueueStatus {
  if (postStatus === 'published') return 'completed'
  if (postStatus === 'failed') return 'failed'
  if (postStatus === 'cancelled') return 'failed'
  return 'waiting'
}

function formatScheduledTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const isTomorrow = d.toDateString() === new Date(now.getTime() + 86_400_000).toDateString()
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (isToday) return time
  if (isTomorrow) return `Tomorrow ${time}`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ` ${time}`
}

function mapPostsToJobs(posts: ScheduledPost[]) {
  return posts.map((p) => ({
    id: p.id.slice(-8),
    post: p.content.replace(/\n/g, ' ').slice(0, 60),
    platform: p.platforms[0] ?? 'facebook',
    time: formatScheduledTime(p.scheduledAt),
    status: toQueueStatus(p.status),
    attempts: p.status === 'published' || p.status === 'failed' ? 1 : 0,
  }))
}

const STATUS_CONFIG = {
  completed: { icon: CheckCircle2, label: 'Published', iconClass: 'text-status-success', badge: 'bg-status-success/10 text-status-success' },
  active: { icon: Loader2, label: 'Publishing', iconClass: 'text-coral', badge: 'bg-coral/10 text-coral' },
  delayed: { icon: AlertTriangle, label: 'Delayed', iconClass: 'text-status-warning', badge: 'bg-status-warning/10 text-status-warning' },
  failed: { icon: XCircle, label: 'Failed', iconClass: 'text-status-error', badge: 'bg-status-error/10 text-status-error' },
  waiting: { icon: Clock, label: 'Waiting', iconClass: 'text-ink-disabled', badge: 'bg-surface-overlay text-ink-secondary' },
} as const

const PLATFORM_CHIP: Record<string, string> = {
  linkedin: 'bg-platform-linkedin/15 text-platform-linkedin',
  instagram: 'bg-platform-instagram/15 text-platform-instagram',
  twitter: 'bg-platform-twitter/15 text-platform-twitter',
  facebook: 'bg-platform-facebook/15 text-platform-facebook',
}

export default async function QueuesPage() {
  const { posts: postsService } = getPubServices()
  const { posts } = await postsService.listScheduledPosts({ limit: 100 }).catch(() => ({ posts: [], total: 0 }))
  const jobs = mapPostsToJobs(posts)

  return (
    <div className="flex h-screen overflow-hidden bg-surface-base">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-7 max-w-[1100px] mx-auto">

          <div className="mb-8">
            <h1 className="text-[22px] font-semibold text-ink-primary font-display mb-0.5">
              Queue Monitor
            </h1>
            <p className="text-[13px] text-ink-secondary">
              Post publishing jobs · Redis-backed with retry handling
            </p>
          </div>

          <div className="grid grid-cols-5 gap-3 mb-6">
            {(['waiting', 'active', 'delayed', 'completed', 'failed'] as const).map((s) => {
              const cfg = STATUS_CONFIG[s]
              const count = jobs.filter((j) => j.status === s).length
              return (
                <div key={s} className="rounded-xl border border-edge-default bg-surface-raised px-4 py-3.5">
                  <p className="text-[10px] font-medium tracking-[0.06em] uppercase text-ink-disabled">
                    {cfg.label}
                  </p>
                  <p className={cn('text-[26px] font-bold mt-1 font-display tabular-nums leading-none', cfg.iconClass)}>
                    {count}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="rounded-xl border border-edge-default bg-surface-raised overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-edge-subtle">
                  {['Job ID', 'Post', 'Platform', 'Scheduled', 'Status', 'Retries'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-left text-[10px] font-medium tracking-[0.06em] uppercase text-ink-disabled"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const cfg = STATUS_CONFIG[job.status as keyof typeof STATUS_CONFIG]
                  const Icon = cfg.icon
                  return (
                    <tr
                      key={job.id}
                      className="border-b border-edge-subtle/40 last:border-0 hover:bg-surface-overlay/40 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <code className="font-mono text-[11px] text-ink-disabled">{job.id}</code>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-[13px] text-ink-primary max-w-[200px] truncate">{job.post}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', PLATFORM_CHIP[job.platform] ?? 'bg-surface-overlay text-ink-secondary')}>
                          {job.platform}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[12px] text-ink-secondary">{job.time}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium', cfg.badge)}>
                          <Icon className={cn('h-3 w-3', job.status === 'active' && 'animate-spin')} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-[12px] text-ink-secondary tabular-nums">
                          {job.attempts}/3
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

        </div>
      </main>
    </div>
  )
}
