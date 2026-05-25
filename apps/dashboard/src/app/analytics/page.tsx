'use client'
import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { EngagementChart } from '@/components/dashboard/EngagementChart'
import { TrendingUp, Users, CheckCircle2, CalendarCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SocialAccount, ScheduledPost } from '@publer-mcp/shared-types'

const PLATFORM_CHIP: Record<string, string> = {
  linkedin: 'bg-platform-linkedin/15 text-platform-linkedin',
  instagram: 'bg-platform-instagram/15 text-platform-instagram',
  twitter: 'bg-platform-twitter/15 text-platform-twitter',
  facebook: 'bg-platform-facebook/15 text-platform-facebook',
}

interface AnalyticsData {
  totalFollowers: number
  weeklyGrowth: number
  growthPercent: number
  platformsActive: number
  scheduledCount: number
  publishedThisWeek: number
}

export default function AnalyticsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [allPosts, setAllPosts] = useState<ScheduledPost[]>([])
  const [activePlatform, setActivePlatform] = useState<string>('All')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    fetch('/api/accounts')
      .then((r) => r.json())
      .then((data: SocialAccount[]) => setAccounts(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/posts?limit=20')
      .then((r) => r.json())
      .then((data: { posts?: ScheduledPost[] }) => {
        if (data.posts) setAllPosts(data.posts)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => (r.ok ? r.json() : { success: false }))
      .then(({ success, data }: { success: boolean; data?: AnalyticsData }) => {
        if (success && data) setAnalyticsData(data)
      })
      .catch(() => {})
  }, [])

  const platforms = ['All', ...Array.from(new Set(accounts.map((a) => a.platform)))]

  const posts =
    activePlatform === 'All'
      ? allPosts
      : allPosts.filter((p) => p.platforms.includes(activePlatform as ScheduledPost['platforms'][number]))

  return (
    <div className="flex h-screen overflow-hidden bg-surface-base">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-7 max-w-[1200px] mx-auto">

          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-[22px] font-semibold text-ink-primary font-display mb-0.5">Analytics</h1>
              <p className="text-[13px] text-ink-secondary">Platform performance · last 7 days</p>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-raised border border-edge-default">
              {platforms.map((p) => (
                <button
                  key={p}
                  onClick={() => setActivePlatform(p)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors duration-100 capitalize',
                    activePlatform === p
                      ? 'bg-surface-overlay text-ink-primary'
                      : 'text-ink-secondary hover:text-ink-primary'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <MetricCard title="Total Followers" value={analyticsData?.totalFollowers ?? 0} icon={Users} />
            <MetricCard title="Growth This Week" value={analyticsData?.weeklyGrowth ?? 0} change={analyticsData?.growthPercent} icon={TrendingUp} />
            <MetricCard title="Published This Week" value={analyticsData?.publishedThisWeek ?? 0} icon={CheckCircle2} />
            <MetricCard title="Scheduled Posts" value={analyticsData?.scheduledCount ?? 0} icon={CalendarCheck} />
          </div>

          <div className="mb-6">
            <EngagementChart />
          </div>

          <div className="rounded-xl border border-edge-default bg-surface-raised overflow-hidden">
            <div className="px-5 py-4 border-b border-edge-subtle">
              <p className="text-[13px] font-medium text-ink-secondary">Top Posts</p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-edge-subtle">
                  {['Platform', 'Content', 'Reach', 'Engagements', 'Rate'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-[10px] font-medium tracking-[0.06em] uppercase text-ink-disabled"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-[13px] text-ink-disabled">
                      No posts found for this period.
                    </td>
                  </tr>
                ) : posts.map((post) => {
                  const platform = post.platforms[0] ?? 'facebook'
                  return (
                    <tr
                      key={post.id}
                      className="border-b border-edge-subtle/40 last:border-0 hover:bg-surface-overlay/40 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', PLATFORM_CHIP[platform] ?? 'bg-surface-overlay text-ink-secondary')}>
                          {platform}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 max-w-xs">
                        <p className="text-[13px] text-ink-secondary truncate">
                          {post.content.replace(/\n/g, ' ')}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[12px] text-ink-disabled tabular-nums">—</td>
                      <td className="px-5 py-3.5 font-mono text-[12px] text-ink-disabled tabular-nums">—</td>
                      <td className="px-5 py-3.5 font-mono text-[12px] text-ink-disabled tabular-nums">—</td>
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
