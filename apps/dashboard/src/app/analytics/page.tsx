'use client'
import { useState } from 'react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { EngagementChart } from '@/components/dashboard/EngagementChart'
import { TrendingUp, Users, MousePointerClick, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const PLATFORMS = ['All', 'LinkedIn', 'Instagram', 'Twitter'] as const
type Platform = (typeof PLATFORMS)[number]

const METRICS: Record<Platform, { engRate: number; followers: number; clicks: number; shares: number }> = {
  All: { engRate: 4.8, followers: 1_240, clicks: 3_820, shares: 892 },
  LinkedIn: { engRate: 6.1, followers: 420, clicks: 1_200, shares: 310 },
  Instagram: { engRate: 5.2, followers: 680, clicks: 1_940, shares: 445 },
  Twitter: { engRate: 2.4, followers: 140, clicks: 680, shares: 137 },
}

const TOP_POSTS = [
  { platform: 'LinkedIn', content: 'Publer MCP is now live for all accounts.', reach: 4_820, eng: 192, rate: '3.98%' },
  { platform: 'Instagram', content: 'Behind the scenes: building AI-native tools.', reach: 8_340, eng: 611, rate: '7.3%' },
  { platform: 'Twitter', content: 'The future of social is conversational.', reach: 2_100, eng: 87, rate: '4.1%' },
  { platform: 'LinkedIn', content: 'Meet the team behind Publer MCP.', reach: 3_610, eng: 148, rate: '4.1%' },
]

const PLATFORM_CHIP: Record<string, string> = {
  LinkedIn: 'bg-platform-linkedin/15 text-platform-linkedin',
  Instagram: 'bg-platform-instagram/15 text-platform-instagram',
  Twitter: 'bg-platform-twitter/15 text-platform-twitter',
}

export default function AnalyticsPage() {
  const [platform, setPlatform] = useState<Platform>('All')
  const m = METRICS[platform]

  const posts = platform === 'All' ? TOP_POSTS : TOP_POSTS.filter((p) => p.platform === platform)

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
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors duration-100',
                    platform === p
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
            <MetricCard title="Avg. Engagement Rate" value={m.engRate} change={0.6} icon={TrendingUp} />
            <MetricCard title="New Followers" value={m.followers} change={18.4} icon={Users} />
            <MetricCard title="Link Clicks" value={m.clicks} change={-2.1} icon={MousePointerClick} />
            <MetricCard title="Shares" value={m.shares} change={9.3} icon={Share2} />
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
                {posts.map((post, i) => (
                  <tr
                    key={i}
                    className="border-b border-edge-subtle/40 last:border-0 hover:bg-surface-overlay/40 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium', PLATFORM_CHIP[post.platform] ?? 'bg-surface-overlay text-ink-secondary')}>
                        {post.platform}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <p className="text-[13px] text-ink-secondary truncate">{post.content}</p>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[12px] text-ink-secondary tabular-nums">
                      {post.reach.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[12px] text-ink-secondary tabular-nums">
                      {post.eng}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[12px] text-status-success tabular-nums">
                      {post.rate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </main>
    </div>
  )
}
