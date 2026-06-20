import { Sidebar } from '@/components/dashboard/Sidebar'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { LiveActivityFeed } from '@/components/dashboard/LiveActivityFeed'
import { EngagementChart } from '@/components/dashboard/EngagementChart'
import { getPubServices } from '@/lib/publer.server'
import { Users, TrendingUp, CalendarCheck, CheckCircle2 } from 'lucide-react'
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
  const pubServices = getPubServices()

  if (!pubServices) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-base">
        <p className="text-ink-secondary text-sm">PUBLER_API_KEY is not configured.</p>
      </div>
    )
  }

  const { accounts, posts, analytics } = pubServices

  const [accountList, { posts: scheduledPosts }, followerMetrics] = await Promise.all([
    accounts.listAccounts().catch(() => [] as SocialAccount[]),
    posts.listScheduledPosts({ limit: 200 }).catch(() => ({ posts: [], total: 0 })),
    analytics.getFollowers().catch(() => []),
  ])

  const connectedCount = countConnected(accountList)
  const scheduledCount = scheduledPosts.filter((p) => p.status === 'scheduled').length
  const totalFollowers = followerMetrics.reduce((sum, m) => sum + m.followers, 0)
  const weeklyGrowth = followerMetrics.reduce((sum, m) => sum + m.growthThisWeek, 0)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000)
  const publishedThisWeek = scheduledPosts.filter(
    (p) => p.status === 'published' && new Date(p.scheduledAt) >= sevenDaysAgo
  ).length

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
            <MetricCard title="Total Followers" value={totalFollowers} change={weeklyGrowth > 0 ? weeklyGrowth : undefined} icon={Users} />
            <MetricCard title="Weekly Growth" value={weeklyGrowth} icon={TrendingUp} />
            <MetricCard title="Published This Week" value={publishedThisWeek} icon={CheckCircle2} />
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
