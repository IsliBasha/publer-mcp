import { z } from 'zod'
import { PlatformSchema } from './common.js'

export const FollowerMetricsSchema = z.object({
  platform: PlatformSchema,
  accountId: z.string(),
  accountName: z.string(),
  followers: z.number().int(),
  following: z.number().int().optional(),
  growthThisWeek: z.number().describe('Net follower change this week'),
  growthPercent: z.number().describe('Growth percentage vs last period'),
  historicalData: z
    .array(
      z.object({
        date: z.string().datetime(),
        count: z.number().int(),
      })
    )
    .optional(),
})
export type FollowerMetrics = z.infer<typeof FollowerMetricsSchema>

export const PostAnalyticsSchema = z.object({
  postId: z.string(),
  platform: PlatformSchema,
  content: z.string(),
  publishedAt: z.string().datetime(),
  metrics: z.object({
    likes: z.number().int(),
    comments: z.number().int(),
    shares: z.number().int(),
    reach: z.number().int(),
    impressions: z.number().int(),
    clicks: z.number().int().optional(),
    saves: z.number().int().optional(),
    engagementRate: z.number().describe('Engagement rate as percentage'),
    engagementScore: z.number().min(0).max(100).describe('Heuristic quality score 0-100'),
  }),
})
export type PostAnalytics = z.infer<typeof PostAnalyticsSchema>

export const BestPostingTimeSchema = z.object({
  platform: PlatformSchema,
  recommendations: z.array(
    z.object({
      dayOfWeek: z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
      hour: z.number().int().min(0).max(23),
      timezone: z.string(),
      expectedEngagementBoost: z.number().describe('Expected % boost vs average'),
      confidence: z.enum(['low', 'medium', 'high']),
    })
  ),
  reasoning: z.string().describe('AI-generated explanation of the recommendations'),
})
export type BestPostingTime = z.infer<typeof BestPostingTimeSchema>

export const EngagementSummarySchema = z.object({
  period: z.object({ from: z.string().datetime(), to: z.string().datetime() }),
  totalPosts: z.number().int(),
  totalReach: z.number().int(),
  totalEngagements: z.number().int(),
  avgEngagementRate: z.number(),
  topPost: z.object({ id: z.string(), content: z.string(), engagementRate: z.number() }),
  platformBreakdown: z.record(
    z.string(),
    z.object({ posts: z.number(), reach: z.number(), engagements: z.number() })
  ),
  aiSummary: z.string().describe('AI-generated executive summary of performance'),
  trends: z.array(z.string()).describe('Key trend observations'),
  recommendations: z.array(z.string()).describe('Actionable AI recommendations'),
})
export type EngagementSummary = z.infer<typeof EngagementSummarySchema>
