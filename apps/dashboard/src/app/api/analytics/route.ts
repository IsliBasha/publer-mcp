import { NextRequest, NextResponse } from 'next/server'
import { getPubServices } from '@/lib/publer.server'
import type { ScheduledPost } from '@publer-mcp/shared-types'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

interface ChartDataPoint {
  date: string
  [platform: string]: number | string
}

/**
 * Aggregates posts from the last 7 days into a daily chart data array.
 * Each entry counts scheduled/published posts per platform per day.
 */
function buildChartData(posts: ScheduledPost[]): ChartDataPoint[] {
  const today = new Date()

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - i))
    const dayName = DAY_NAMES[date.getDay()]!

    const postsOnDay = posts.filter((p) => {
      const pDate = new Date(p.scheduledAt)
      return pDate.toDateString() === date.toDateString()
    })

    const counts: ChartDataPoint = { date: dayName }
    for (const post of postsOnDay) {
      for (const platform of post.platforms) {
        counts[platform] = ((counts[platform] as number | undefined) ?? 0) + 1
      }
    }
    return counts
  })
}

export async function GET(_req: NextRequest) {
  try {
    const services = getPubServices()
    if (!services) {
      return NextResponse.json({ success: false, error: 'PUBLER_API_KEY is not configured' }, { status: 503 })
    }
    const { analytics, posts } = services

    const [followerMetrics, { posts: postList }] = await Promise.all([
      analytics.getFollowers(),
      posts.listScheduledPosts({ limit: 200 }),
    ])

    const totalFollowers = followerMetrics.reduce((sum, m) => sum + m.followers, 0)
    const weeklyGrowth = followerMetrics.reduce((sum, m) => sum + m.growthThisWeek, 0)
    const avgGrowthPercent =
      followerMetrics.length > 0
        ? followerMetrics.reduce((sum, m) => sum + m.growthPercent, 0) / followerMetrics.length
        : 0

    const uniquePlatforms = new Set(followerMetrics.map((m) => m.platform))
    const platformsActive = uniquePlatforms.size

    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000)
    const recentPosts = postList.filter((p) => new Date(p.scheduledAt) >= sevenDaysAgo)
    const scheduledCount = postList.filter((p) => p.status === 'scheduled').length
    const publishedThisWeek = recentPosts.filter((p) => p.status === 'published').length
    const chartData = buildChartData(recentPosts)

    return NextResponse.json({
      success: true,
      data: {
        totalFollowers,
        weeklyGrowth,
        growthPercent: parseFloat(avgGrowthPercent.toFixed(1)),
        platformsActive,
        scheduledCount,
        publishedThisWeek,
        chartData,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch analytics'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
