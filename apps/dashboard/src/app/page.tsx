import { Sidebar } from '@/components/dashboard/Sidebar'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { LiveActivityFeed } from '@/components/dashboard/LiveActivityFeed'
import { EngagementChart } from '@/components/dashboard/EngagementChart'
import { getPubServices } from '@/lib/publer.server'
import { Users, Eye, Heart, CalendarCheck } from 'lucide-react'
import type { SocialAccount } from '@publer-mcp/shared-types'

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getDateLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function countConnected(accounts: SocialAccount[]): number {
  return accounts.filter((a) => a.isConnected).length
}

export default async function DashboardPage() {
  const { accounts, posts } = getPubServices()

  const [accountList, { posts: scheduledPosts }] = await Promise.all([
    accounts.listAccounts().catch(() => [] as SocialAccount[]),
    posts.listScheduledPosts({ limit: 100 }).catch(() => ({ posts: [], total: 0 })),
  ])

  const connectedCount = countConnected(accountList)
  const scheduledCount = scheduledPosts.length

  return (
    <div className="flex h-screen overflow-hidden bg-surface-base">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-7 max-w-[1200px] mx-auto">

          <header className="mb-8">
            <p className="text-[11px] font-medium tracking-widest uppercase text-ink-disabled mb-1">
              {getDateLabel()}
            </p>
            <h1 className="text-[22px] font-semibold text-ink-primary font-display">
              {getGreeting()}, Isli
            </h1>
            <p className="text-[13px] text-ink-secondary mt-0.5">
              {connectedCount} {connectedCount === 1 ? 'account' : 'accounts'} connected
              {scheduledCount > 0 && ` · ${scheduledCount} posts scheduled`}
            </p>
          </header>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <MetricCard title="Total Followers" value={48_320} change={3.2} icon={Users} />
            <MetricCard title="Weekly Reach" value={124_800} change={8.7} icon={Eye} />
            <MetricCard title="Engagements" value={9_420} change={12.1} icon={Heart} />
            <MetricCard title="Scheduled Posts" value={scheduledCount} icon={CalendarCheck} />
          </div>

          <div className="grid grid-cols-3 gap-4" style={{ minHeight: 320 }}>
            <div className="col-span-2">
              <EngagementChart />
            </div>
            <LiveActivityFeed />
          </div>

        </div>
      </main>
    </div>
  )
}
