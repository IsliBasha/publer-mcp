import { AxiosInstance } from 'axios'
import type { FollowerMetrics, PostAnalytics, BestPostingTime } from '@publer-mcp/shared-types'
import type { Platform } from '@publer-mcp/shared-types'
import type { PublerApiAccount } from '../types/publer-api.js'

// Publer API v1 has no analytics endpoints — these are industry best-practice fallbacks.
const BEST_TIMES: Record<string, BestPostingTime['recommendations']> = {
  linkedin:  [
    { dayOfWeek: 'Tue', hour: 10, timezone: 'UTC', expectedEngagementBoost: 38, confidence: 'high' },
    { dayOfWeek: 'Wed', hour: 9,  timezone: 'UTC', expectedEngagementBoost: 32, confidence: 'high' },
    { dayOfWeek: 'Thu', hour: 10, timezone: 'UTC', expectedEngagementBoost: 28, confidence: 'medium' },
  ],
  instagram: [
    { dayOfWeek: 'Mon', hour: 11, timezone: 'UTC', expectedEngagementBoost: 35, confidence: 'high' },
    { dayOfWeek: 'Wed', hour: 11, timezone: 'UTC', expectedEngagementBoost: 40, confidence: 'high' },
    { dayOfWeek: 'Fri', hour: 10, timezone: 'UTC', expectedEngagementBoost: 30, confidence: 'medium' },
  ],
  twitter: [
    { dayOfWeek: 'Wed', hour: 9,  timezone: 'UTC', expectedEngagementBoost: 30, confidence: 'high' },
    { dayOfWeek: 'Fri', hour: 9,  timezone: 'UTC', expectedEngagementBoost: 25, confidence: 'medium' },
    { dayOfWeek: 'Mon', hour: 8,  timezone: 'UTC', expectedEngagementBoost: 22, confidence: 'medium' },
  ],
  facebook: [
    { dayOfWeek: 'Wed', hour: 13, timezone: 'UTC', expectedEngagementBoost: 28, confidence: 'high' },
    { dayOfWeek: 'Fri', hour: 11, timezone: 'UTC', expectedEngagementBoost: 24, confidence: 'medium' },
    { dayOfWeek: 'Mon', hour: 12, timezone: 'UTC', expectedEngagementBoost: 20, confidence: 'medium' },
  ],
  tiktok: [
    { dayOfWeek: 'Tue', hour: 19, timezone: 'UTC', expectedEngagementBoost: 42, confidence: 'high' },
    { dayOfWeek: 'Thu', hour: 19, timezone: 'UTC', expectedEngagementBoost: 38, confidence: 'high' },
    { dayOfWeek: 'Sat', hour: 11, timezone: 'UTC', expectedEngagementBoost: 35, confidence: 'medium' },
  ],
  pinterest: [
    { dayOfWeek: 'Sat', hour: 20, timezone: 'UTC', expectedEngagementBoost: 30, confidence: 'medium' },
    { dayOfWeek: 'Sun', hour: 21, timezone: 'UTC', expectedEngagementBoost: 26, confidence: 'medium' },
    { dayOfWeek: 'Fri', hour: 21, timezone: 'UTC', expectedEngagementBoost: 22, confidence: 'low' },
  ],
  youtube: [
    { dayOfWeek: 'Fri', hour: 17, timezone: 'UTC', expectedEngagementBoost: 35, confidence: 'high' },
    { dayOfWeek: 'Sat', hour: 11, timezone: 'UTC', expectedEngagementBoost: 40, confidence: 'high' },
    { dayOfWeek: 'Sun', hour: 11, timezone: 'UTC', expectedEngagementBoost: 32, confidence: 'medium' },
  ],
}

export class AnalyticsService {
  constructor(private readonly client: AxiosInstance) {}

  // Derives account list from /accounts since Publer API has no /analytics/followers endpoint.
  async getFollowers(accountId?: string): Promise<FollowerMetrics[]> {
    const SUPPORTED = new Set(['twitter', 'linkedin', 'instagram', 'facebook', 'tiktok', 'pinterest', 'youtube'])
    const response = await this.client.get<PublerApiAccount[]>('/accounts')
    return response.data
      .filter((a) => (!accountId || a.id === accountId) && SUPPORTED.has(a.provider))
      .map((a) => ({
        platform: a.provider as Platform,
        accountId: a.id,
        accountName: a.name,
        followers: 0,
        following: 0,
        growthThisWeek: 0,
        growthPercent: 0,
        historicalData: [],
      }))
  }

  // Publer API has no per-post analytics endpoint; returns placeholder data.
  async getPostAnalytics(postId: string): Promise<PostAnalytics> {
    return {
      postId,
      platform: 'facebook' as Platform,
      content: '',
      publishedAt: new Date().toISOString(),
      metrics: {
        likes: 0, comments: 0, shares: 0, reach: 0, impressions: 0,
        clicks: 0, saves: 0, engagementRate: 0, engagementScore: 0,
      },
    }
  }

  // Returns industry best-practice posting times; Publer API has no best-time endpoint.
  async getBestPostingTime(platform: Platform, _accountId?: string): Promise<BestPostingTime> {
    const recommendations = BEST_TIMES[platform] ?? BEST_TIMES['facebook']
    return {
      platform,
      recommendations,
      reasoning: `Industry best-practice posting windows for ${platform}. Connect a Publer Business plan for audience-specific data.`,
    }
  }
}
