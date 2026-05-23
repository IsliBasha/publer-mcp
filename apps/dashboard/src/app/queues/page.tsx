import { Sidebar } from '@/components/dashboard/Sidebar'
import { CheckCircle2, XCircle, Clock, Loader2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

const MOCK_JOBS = [
  { id: 'job-001', post: 'LinkedIn product launch', platform: 'linkedin', time: '10:00 AM', status: 'completed', attempts: 1 },
  { id: 'job-002', post: 'Instagram brand story', platform: 'instagram', time: '2:00 PM', status: 'active', attempts: 1 },
  { id: 'job-003', post: 'Twitter AI thread', platform: 'twitter', time: '4:30 PM', status: 'delayed', attempts: 0 },
  { id: 'job-004', post: 'Facebook campaign post', platform: 'facebook', time: '9:00 AM', status: 'failed', attempts: 3 },
  { id: 'job-005', post: 'LinkedIn insight article', platform: 'linkedin', time: 'Tomorrow 8 AM', status: 'waiting', attempts: 0 },
  { id: 'job-006', post: 'Instagram product feature', platform: 'instagram', time: 'Tomorrow 2 PM', status: 'waiting', attempts: 0 },
]

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

export default function QueuesPage() {
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
              const count = MOCK_JOBS.filter((j) => j.status === s).length
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
                {MOCK_JOBS.map((job) => {
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
