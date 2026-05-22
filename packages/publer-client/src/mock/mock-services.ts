import type {
  SocialAccount,
  ScheduledPost,
  CreatePost,
  SchedulePost,
  UpdateScheduledPost,
  FollowerMetrics,
  PostAnalytics,
  BestPostingTime,
  Platform,
} from '@publer-mcp/shared-types'
import type { PostsService } from '../posts/posts.service.js'
import type { AnalyticsService } from '../analytics/analytics.service.js'
import type { AccountsService } from '../accounts/accounts.service.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysFromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(10, 0, 0, 0)
  return d.toISOString()
}

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(10, 0, 0, 0)
  return d.toISOString()
}

function uid(): string {
  return `mock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

// ─── Static fixture data ───────────────────────────────────────────────────────

const MOCK_WORKSPACE_ID = 'ws-mock-001'

const MOCK_ACCOUNTS: SocialAccount[] = [
  {
    id: 'acc-li-001',
    platform: 'linkedin',
    name: 'Acme Corp',
    username: 'acme-corp',
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
    workspaceId: MOCK_WORKSPACE_ID,
    isConnected: true,
    connectedAt: daysAgo(90),
  },
  {
    id: 'acc-tw-001',
    platform: 'twitter',
    name: 'Acme Corp',
    username: '@acmecorp',
    avatarUrl: 'https://i.pravatar.cc/150?img=2',
    workspaceId: MOCK_WORKSPACE_ID,
    isConnected: true,
    connectedAt: daysAgo(90),
  },
  {
    id: 'acc-ig-001',
    platform: 'instagram',
    name: 'Acme Corp',
    username: '@acmecorp.ig',
    avatarUrl: 'https://i.pravatar.cc/150?img=3',
    workspaceId: MOCK_WORKSPACE_ID,
    isConnected: true,
    connectedAt: daysAgo(60),
  },
  {
    id: 'acc-fb-001',
    platform: 'facebook',
    name: 'Acme Corp Page',
    username: 'AcmeCorpOfficial',
    avatarUrl: 'https://i.pravatar.cc/150?img=4',
    workspaceId: MOCK_WORKSPACE_ID,
    isConnected: true,
    connectedAt: daysAgo(120),
  },
]

// In-memory post store — mutated by create/update/delete within a session
let posts: ScheduledPost[] = [
  {
    id: 'post-mock-001',
    content:
      'Excited to share our Q2 roadmap with the community! 🚀 Building the future of social media automation, one feature at a time.\n\nStay tuned for major announcements next week.\n\n#ProductLaunch #SaaS #Innovation',
    platforms: ['linkedin'],
    scheduledAt: daysFromNow(1),
    status: 'scheduled',
    accountIds: ['acc-li-001'],
    mediaUrls: [],
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
    publerPostId: 'post-mock-001',
  },
  {
    id: 'post-mock-002',
    content:
      '🔥 This changes everything.\n\nWe just hit 10,000 users. Thank YOU.\n\nThread on how we got here 🧵👇',
    platforms: ['twitter'],
    scheduledAt: daysFromNow(2),
    status: 'scheduled',
    accountIds: ['acc-tw-001'],
    mediaUrls: [],
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    publerPostId: 'post-mock-002',
  },
  {
    id: 'post-mock-003',
    content:
      'Behind the scenes of how we build ✨\n\nEvery great product starts with a team that cares.\n\n#startup #buildinpublic #team',
    platforms: ['instagram'],
    scheduledAt: daysFromNow(3),
    status: 'scheduled',
    accountIds: ['acc-ig-001'],
    mediaUrls: ['https://picsum.photos/seed/mock1/800/600'],
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    publerPostId: 'post-mock-003',
  },
  {
    id: 'post-mock-004',
    content:
      'We are thrilled to announce our partnership with industry leaders to bring next-generation social media management to businesses of all sizes.',
    platforms: ['facebook'],
    scheduledAt: daysFromNow(5),
    status: 'scheduled',
    accountIds: ['acc-fb-001'],
    mediaUrls: [],
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
    publerPostId: 'post-mock-004',
  },
  {
    id: 'post-mock-005',
    content:
      'Multi-platform drop 📣\n\nOur new AI caption generator is live. Write better social posts in seconds.\n\nLink in bio.',
    platforms: ['linkedin', 'twitter', 'instagram'],
    scheduledAt: daysFromNow(7),
    status: 'scheduled',
    accountIds: ['acc-li-001', 'acc-tw-001', 'acc-ig-001'],
    mediaUrls: [],
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
    publerPostId: 'post-mock-005',
  },
  // Published posts — useful for analytics testing
  {
    id: 'post-mock-pub-001',
    content: "Launching today: the feature you've all been asking for. DM us to get early access.",
    platforms: ['linkedin'],
    scheduledAt: daysAgo(5),
    status: 'published',
    accountIds: ['acc-li-001'],
    mediaUrls: [],
    createdAt: daysAgo(7),
    updatedAt: daysAgo(5),
    publerPostId: 'post-mock-pub-001',
  },
  {
    id: 'post-mock-pub-002',
    content: 'Good morning ☀️ Quick reminder: consistency beats perfection. Post today.',
    platforms: ['twitter'],
    scheduledAt: daysAgo(3),
    status: 'published',
    accountIds: ['acc-tw-001'],
    mediaUrls: [],
    createdAt: daysAgo(4),
    updatedAt: daysAgo(3),
    publerPostId: 'post-mock-pub-002',
  },
  {
    id: 'post-mock-pub-003',
    content: 'Our most-liked post of the month 🙏 Thank you for 24K followers on Instagram!',
    platforms: ['instagram'],
    scheduledAt: daysAgo(1),
    status: 'published',
    accountIds: ['acc-ig-001'],
    mediaUrls: ['https://picsum.photos/seed/mock2/800/600'],
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1),
    publerPostId: 'post-mock-pub-003',
  },
]

// ─── Mock follower data ───────────────────────────────────────────────────────

function buildHistorical(base: number, weeklyGrowth: number): { date: string; count: number }[] {
  const result: { date: string; count: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dailyGrowth = Math.round((weeklyGrowth / 7) * (0.8 + Math.random() * 0.4))
    const count = base - Math.round((weeklyGrowth / 7) * i) + dailyGrowth
    result.push({ date: d.toISOString(), count })
  }
  return result
}

const MOCK_FOLLOWERS: FollowerMetrics[] = [
  {
    platform: 'linkedin',
    accountId: 'acc-li-001',
    accountName: 'Acme Corp',
    followers: 12_400,
    following: 340,
    growthThisWeek: 340,
    growthPercent: 2.8,
    historicalData: buildHistorical(12_400, 340),
  },
  {
    platform: 'twitter',
    accountId: 'acc-tw-001',
    accountName: 'Acme Corp',
    followers: 8_220,
    following: 512,
    growthThisWeek: 120,
    growthPercent: 1.5,
    historicalData: buildHistorical(8_220, 120),
  },
  {
    platform: 'instagram',
    accountId: 'acc-ig-001',
    accountName: 'Acme Corp',
    followers: 24_500,
    following: 180,
    growthThisWeek: 890,
    growthPercent: 3.8,
    historicalData: buildHistorical(24_500, 890),
  },
  {
    platform: 'facebook',
    accountId: 'acc-fb-001',
    accountName: 'Acme Corp Page',
    followers: 5_100,
    following: 0,
    growthThisWeek: 45,
    growthPercent: 0.9,
    historicalData: buildHistorical(5_100, 45),
  },
]

// ─── Mock analytics per published post ───────────────────────────────────────

const MOCK_POST_ANALYTICS: Record<string, PostAnalytics> = {
  'post-mock-pub-001': {
    postId: 'post-mock-pub-001',
    platform: 'linkedin',
    content: "Launching today: the feature you've all been asking for.",
    publishedAt: daysAgo(5),
    metrics: {
      likes: 412,
      comments: 58,
      shares: 34,
      reach: 14_200,
      impressions: 18_900,
      clicks: 820,
      saves: 112,
      engagementRate: 3.6,
      engagementScore: 82,
    },
  },
  'post-mock-pub-002': {
    postId: 'post-mock-pub-002',
    platform: 'twitter',
    content: 'Good morning ☀️ Quick reminder: consistency beats perfection.',
    publishedAt: daysAgo(3),
    metrics: {
      likes: 198,
      comments: 24,
      shares: 67,
      reach: 6_800,
      impressions: 9_100,
      clicks: 210,
      saves: 45,
      engagementRate: 4.2,
      engagementScore: 78,
    },
  },
  'post-mock-pub-003': {
    postId: 'post-mock-pub-003',
    platform: 'instagram',
    content: 'Our most-liked post of the month 🙏',
    publishedAt: daysAgo(1),
    metrics: {
      likes: 1_840,
      comments: 143,
      shares: 92,
      reach: 32_400,
      impressions: 41_000,
      clicks: 0,
      saves: 620,
      engagementRate: 6.4,
      engagementScore: 91,
    },
  },
}

// ─── Best posting time per platform ──────────────────────────────────────────

const BEST_TIMES: Record<string, BestPostingTime['recommendations']> = {
  linkedin: [
    { dayOfWeek: 'Tue', hour: 8, timezone: 'UTC', expectedEngagementBoost: 42, confidence: 'high' },
    { dayOfWeek: 'Wed', hour: 12, timezone: 'UTC', expectedEngagementBoost: 38, confidence: 'high' },
    { dayOfWeek: 'Thu', hour: 9, timezone: 'UTC', expectedEngagementBoost: 31, confidence: 'medium' },
  ],
  twitter: [
    { dayOfWeek: 'Mon', hour: 9, timezone: 'UTC', expectedEngagementBoost: 35, confidence: 'high' },
    { dayOfWeek: 'Wed', hour: 13, timezone: 'UTC', expectedEngagementBoost: 28, confidence: 'medium' },
    { dayOfWeek: 'Fri', hour: 11, timezone: 'UTC', expectedEngagementBoost: 22, confidence: 'medium' },
  ],
  instagram: [
    { dayOfWeek: 'Wed', hour: 11, timezone: 'UTC', expectedEngagementBoost: 55, confidence: 'high' },
    { dayOfWeek: 'Fri', hour: 10, timezone: 'UTC', expectedEngagementBoost: 48, confidence: 'high' },
    { dayOfWeek: 'Sat', hour: 9, timezone: 'UTC', expectedEngagementBoost: 40, confidence: 'medium' },
  ],
  facebook: [
    { dayOfWeek: 'Thu', hour: 13, timezone: 'UTC', expectedEngagementBoost: 30, confidence: 'medium' },
    { dayOfWeek: 'Fri', hour: 12, timezone: 'UTC', expectedEngagementBoost: 27, confidence: 'medium' },
    { dayOfWeek: 'Sat', hour: 11, timezone: 'UTC', expectedEngagementBoost: 22, confidence: 'low' },
  ],
  tiktok: [
    { dayOfWeek: 'Tue', hour: 19, timezone: 'UTC', expectedEngagementBoost: 62, confidence: 'high' },
    { dayOfWeek: 'Thu', hour: 20, timezone: 'UTC', expectedEngagementBoost: 58, confidence: 'high' },
    { dayOfWeek: 'Fri', hour: 21, timezone: 'UTC', expectedEngagementBoost: 51, confidence: 'high' },
  ],
  pinterest: [
    { dayOfWeek: 'Sat', hour: 20, timezone: 'UTC', expectedEngagementBoost: 44, confidence: 'high' },
    { dayOfWeek: 'Sun', hour: 21, timezone: 'UTC', expectedEngagementBoost: 38, confidence: 'medium' },
    { dayOfWeek: 'Fri', hour: 21, timezone: 'UTC', expectedEngagementBoost: 31, confidence: 'medium' },
  ],
  youtube: [
    { dayOfWeek: 'Thu', hour: 14, timezone: 'UTC', expectedEngagementBoost: 47, confidence: 'high' },
    { dayOfWeek: 'Fri', hour: 15, timezone: 'UTC', expectedEngagementBoost: 42, confidence: 'high' },
    { dayOfWeek: 'Sat', hour: 10, timezone: 'UTC', expectedEngagementBoost: 35, confidence: 'medium' },
  ],
}

// ─── Mock service classes ─────────────────────────────────────────────────────

export class MockAccountsService {
  async listAccounts(): Promise<SocialAccount[]> {
    return MOCK_ACCOUNTS
  }
}

export class MockPostsService {
  async createPost(data: CreatePost): Promise<ScheduledPost> {
    const now = new Date().toISOString()
    const post: ScheduledPost = {
      id: uid(),
      content: data.content,
      platforms: data.platforms,
      scheduledAt: data.scheduledAt ?? now,
      status: data.publishNow ? 'published' : 'scheduled',
      accountIds: data.accountIds ?? MOCK_ACCOUNTS.map((a) => a.id),
      mediaUrls: data.mediaUrls ?? [],
      createdAt: now,
      updatedAt: now,
    }
    posts.push(post)
    return post
  }

  async schedulePost(data: SchedulePost): Promise<ScheduledPost> {
    const now = new Date().toISOString()
    const post: ScheduledPost = {
      id: uid(),
      content: data.content,
      platforms: data.platforms,
      scheduledAt: data.scheduledAt,
      status: 'scheduled',
      accountIds: data.accountIds ?? MOCK_ACCOUNTS.map((a) => a.id),
      mediaUrls: data.mediaUrls ?? [],
      createdAt: now,
      updatedAt: now,
    }
    posts.push(post)
    return post
  }

  async listScheduledPosts(params: {
    page?: number
    limit?: number
    platform?: string
    from?: string
    to?: string
  }): Promise<{ posts: ScheduledPost[]; total: number }> {
    let filtered = posts

    if (params.platform) {
      filtered = filtered.filter((p) => p.platforms.includes(params.platform as Platform))
    }
    if (params.from) {
      const from = new Date(params.from)
      filtered = filtered.filter((p) => new Date(p.scheduledAt) >= from)
    }
    if (params.to) {
      const to = new Date(params.to)
      filtered = filtered.filter((p) => new Date(p.scheduledAt) <= to)
    }

    filtered = [...filtered].sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    )

    const page = params.page ?? 1
    const limit = params.limit ?? 20
    const start = (page - 1) * limit
    return {
      posts: filtered.slice(start, start + limit),
      total: filtered.length,
    }
  }

  async updateScheduledPost(data: UpdateScheduledPost): Promise<ScheduledPost> {
    const idx = posts.findIndex((p) => p.id === data.id)
    if (idx === -1) throw new Error(`Post ${data.id} not found`)
    const updated: ScheduledPost = {
      ...posts[idx],
      ...(data.content !== undefined && { content: data.content }),
      ...(data.scheduledAt !== undefined && { scheduledAt: data.scheduledAt }),
      ...(data.mediaUrls !== undefined && { mediaUrls: data.mediaUrls }),
      updatedAt: new Date().toISOString(),
    }
    posts[idx] = updated
    return updated
  }

  async deletePost(postId: string): Promise<void> {
    const idx = posts.findIndex((p) => p.id === postId)
    if (idx === -1) throw new Error(`Post ${postId} not found`)
    posts.splice(idx, 1)
  }
}

export class MockAnalyticsService {
  async getFollowers(accountId?: string): Promise<FollowerMetrics[]> {
    if (accountId) {
      const match = MOCK_FOLLOWERS.filter((f) => f.accountId === accountId)
      if (match.length === 0) throw new Error(`Account ${accountId} not found`)
      return match
    }
    return MOCK_FOLLOWERS
  }

  async getPostAnalytics(postId: string): Promise<PostAnalytics> {
    const known = MOCK_POST_ANALYTICS[postId]
    if (known) return known

    // Generate plausible analytics for any unknown post ID
    return {
      postId,
      platform: 'linkedin',
      content: '[mock post content]',
      publishedAt: daysAgo(Math.floor(Math.random() * 14) + 1),
      metrics: {
        likes: Math.floor(Math.random() * 500) + 50,
        comments: Math.floor(Math.random() * 80) + 5,
        shares: Math.floor(Math.random() * 60) + 5,
        reach: Math.floor(Math.random() * 15000) + 1000,
        impressions: Math.floor(Math.random() * 20000) + 2000,
        clicks: Math.floor(Math.random() * 400) + 20,
        saves: Math.floor(Math.random() * 150) + 10,
        engagementRate: parseFloat((Math.random() * 5 + 1).toFixed(2)),
        engagementScore: Math.floor(Math.random() * 40) + 55,
      },
    }
  }

  async getBestPostingTime(platform: string, _accountId?: string): Promise<BestPostingTime> {
    const recs = BEST_TIMES[platform] ?? BEST_TIMES['linkedin']
    return {
      platform: platform as Platform,
      recommendations: recs,
      reasoning: `Based on mock engagement data for ${platform}, these time slots show the highest historical audience activity and engagement rates.`,
    }
  }
}

export function createMockServices() {
  return {
    posts: new MockPostsService() as unknown as PostsService,
    analytics: new MockAnalyticsService() as unknown as AnalyticsService,
    accounts: new MockAccountsService() as unknown as AccountsService,
  }
}
