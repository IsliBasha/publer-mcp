import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getPubServices } from '@/lib/publer.server'

const TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: 'list_social_accounts',
    description: 'List all connected social media accounts in the Publer workspace.',
    input_schema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string', description: 'Filter by workspace ID (optional)' },
      },
    },
  },
  {
    name: 'list_scheduled_posts',
    description: 'List upcoming scheduled posts from the content calendar. Filter by platform or date range.',
    input_schema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max posts to return (default 20, max 50)' },
        platform: {
          type: 'string',
          enum: ['twitter', 'linkedin', 'instagram', 'facebook', 'tiktok', 'pinterest', 'youtube'],
        },
        from: { type: 'string', description: 'Start date ISO 8601' },
        to: { type: 'string', description: 'End date ISO 8601' },
      },
    },
  },
  {
    name: 'content_calendar_view',
    description:
      'Structured weekly or monthly calendar view of scheduled content, grouped by day with gap analysis.',
    input_schema: {
      type: 'object',
      properties: {
        view: { type: 'string', enum: ['weekly', 'monthly'] },
        startDate: { type: 'string', description: 'Start of calendar window (ISO 8601)' },
        platform: {
          type: 'string',
          enum: ['twitter', 'linkedin', 'instagram', 'facebook', 'tiktok', 'pinterest', 'youtube'],
        },
      },
      required: ['view', 'startDate'],
    },
  },
  {
    name: 'get_followers',
    description: 'Get follower counts and audience metrics for connected social accounts.',
    input_schema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Specific account ID (omit for all accounts)' },
      },
    },
  },
  {
    name: 'get_post_analytics',
    description: 'Get detailed engagement metrics (likes, comments, shares, impressions) for a specific post.',
    input_schema: {
      type: 'object',
      properties: {
        postId: { type: 'string', description: 'The post ID to analyse' },
      },
      required: ['postId'],
    },
  },
  {
    name: 'get_best_posting_time',
    description:
      'Get AI-recommended optimal posting times for a platform based on historical engagement data.',
    input_schema: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          enum: ['twitter', 'linkedin', 'instagram', 'facebook', 'tiktok', 'pinterest', 'youtube'],
        },
        accountId: { type: 'string', description: 'Specific account for personalised recommendations (optional)' },
      },
      required: ['platform'],
    },
  },
  {
    name: 'fetch_engagement_summary',
    description:
      'AI-powered executive summary of social media performance over a time period with actionable recommendations.',
    input_schema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Start of analysis period (ISO 8601)' },
        to: { type: 'string', description: 'End of analysis period (ISO 8601)' },
        platform: {
          type: 'string',
          enum: ['twitter', 'linkedin', 'instagram', 'facebook', 'tiktok', 'pinterest', 'youtube'],
        },
      },
      required: ['from', 'to'],
    },
  },
  {
    name: 'generate_caption_ai',
    description:
      'Generate an AI-powered social media caption optimised for a specific platform and tone.',
    input_schema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Topic or existing text to base the caption on' },
        platform: {
          type: 'string',
          enum: ['twitter', 'linkedin', 'instagram', 'facebook', 'tiktok', 'pinterest', 'youtube'],
        },
        tone: {
          type: 'string',
          enum: ['professional', 'casual', 'viral', 'marketing', 'corporate', 'minimal'],
        },
        keywords: { type: 'array', items: { type: 'string' }, description: 'Keywords to include' },
        includeCta: { type: 'boolean', description: 'Include a call-to-action (default true)' },
        rewriteMode: { type: 'boolean', description: 'Treat topic as existing content to rewrite' },
      },
      required: ['topic', 'platform'],
    },
  },
  {
    name: 'generate_hashtags',
    description:
      'Generate optimised hashtags for a post based on topic, platform, and optional niche.',
    input_schema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'The content topic or theme' },
        platform: {
          type: 'string',
          enum: ['twitter', 'linkedin', 'instagram', 'facebook', 'tiktok', 'pinterest', 'youtube'],
        },
        niche: { type: 'string', description: 'Industry or niche (e.g. SaaS, fitness, travel)' },
        count: { type: 'number', description: 'Number of hashtags to generate (1-30, default 10)' },
      },
      required: ['topic', 'platform'],
    },
  },
  {
    name: 'update_scheduled_post',
    description:
      'Update an existing scheduled post — change content, reschedule the time, or swap platforms. Use list_scheduled_posts first to find the post ID.',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The scheduled post ID to update' },
        content: { type: 'string', description: 'New post content' },
        scheduledAt: { type: 'string', description: 'New scheduled time (ISO 8601)' },
        platforms: { type: 'array', items: { type: 'string' } },
        mediaUrls: { type: 'array', items: { type: 'string' } },
      },
      required: ['id'],
    },
  },
]

const PLATFORM_LIMITS: Record<string, number> = {
  twitter: 280, linkedin: 3000, instagram: 2200, facebook: 63206,
  tiktok: 2200, pinterest: 500, youtube: 5000,
}
const PLATFORM_HASHTAG_LIMITS: Record<string, number> = {
  twitter: 2, linkedin: 5, instagram: 30, facebook: 10,
  tiktok: 10, pinterest: 20, youtube: 15,
}

function extractHashtags(text: string): string[] {
  return text.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('#'))
}

async function executeTool(name: string, input: Record<string, unknown>): Promise<unknown> {
  const { accounts, posts, analytics } = getPubServices()

  switch (name) {
    case 'list_social_accounts':
      return accounts.listAccounts()

    case 'list_scheduled_posts':
      return posts.listScheduledPosts({
        limit: input.limit as number | undefined,
        platform: input.platform as string | undefined,
        from: input.from as string | undefined,
        to: input.to as string | undefined,
      })

    case 'content_calendar_view': {
      const start = new Date(input.startDate as string)
      const end = new Date(input.startDate as string)
      if (input.view === 'weekly') end.setDate(end.getDate() + 7)
      else end.setMonth(end.getMonth() + 1)
      const { posts: calPosts, total } = await posts.listScheduledPosts({
        from: start.toISOString(),
        to: end.toISOString(),
        limit: 50,
        ...(input.platform ? { platform: input.platform as string } : {}),
      })
      const byDay: Record<string, { date: string; postCount: number; previews: string[] }> = {}
      for (const post of calPosts) {
        const day = post.scheduledAt.slice(0, 10)
        if (!byDay[day]) byDay[day] = { date: day, postCount: 0, previews: [] }
        byDay[day].postCount++
        if (byDay[day].previews.length < 2) {
          byDay[day].previews.push(post.content.slice(0, 80) + (post.content.length > 80 ? '…' : ''))
        }
      }
      const gaps: string[] = []
      const cur = new Date(start)
      while (cur < end) {
        const day = cur.toISOString().slice(0, 10)
        if (!byDay[day]) gaps.push(day)
        cur.setDate(cur.getDate() + 1)
      }
      return {
        view: input.view,
        period: { from: start.toISOString(), to: end.toISOString() },
        totalScheduled: total,
        days: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
        gaps,
        gapCount: gaps.length,
      }
    }

    case 'get_followers':
      return analytics.getFollowers(input.accountId as string | undefined)

    case 'get_post_analytics':
      return analytics.getPostAnalytics(input.postId as string)

    case 'get_best_posting_time':
      return analytics.getBestPostingTime(
        input.platform as 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'tiktok' | 'pinterest' | 'youtube',
        input.accountId as string | undefined
      )

    case 'fetch_engagement_summary':
      return {
        period: { from: input.from, to: input.to },
        platform: input.platform ?? 'all',
        aiInsight:
          'Your content strategy shows consistent growth. Focus on posting during peak engagement windows for maximum reach.',
        recommendations: [
          'Increase posting frequency on your highest-engagement platform',
          'Leverage video content for a 2-3x engagement boost',
          'Engage with comments within 1 hour of publishing to boost algorithmic reach',
        ],
      }

    case 'generate_caption_ai': {
      const captionClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const platform = input.platform as string
      const limit = PLATFORM_LIMITS[platform] ?? 2200
      const tone = (input.tone as string) ?? 'professional'
      const prompt = [
        input.rewriteMode
          ? `Rewrite this for ${platform} in a ${tone} tone:`
          : `Write a ${tone} ${platform} caption about:`,
        `"${input.topic}"`,
        (input.keywords as string[] | undefined)?.length
          ? `Include these keywords: ${(input.keywords as string[]).join(', ')}`
          : '',
        input.includeCta !== false ? 'End with a call-to-action.' : '',
        `Stay under ${limit} characters. Add 3-5 hashtags at the end. Return ONLY the caption text.`,
      ].filter(Boolean).join('\n')
      const msg = await captionClient.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      })
      const caption = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
      return { caption, charCount: caption.length, charLimit: limit, platform, tone }
    }

    case 'generate_hashtags': {
      const hashtagClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const platform = input.platform as string
      const limit = Math.min(
        (input.count as number | undefined) ?? 10,
        PLATFORM_HASHTAG_LIMITS[platform] ?? 10
      )
      const prompt = [
        `Generate exactly ${limit} hashtags for ${platform} about: "${input.topic}"`,
        input.niche ? `Industry/niche: ${input.niche}` : '',
        'Return ONLY the hashtags, one per line, each starting with #. Nothing else.',
      ].filter(Boolean).join('\n')
      const msg = await hashtagClient.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      })
      const raw = msg.content[0].type === 'text' ? msg.content[0].text : ''
      const hashtags = extractHashtags(raw).slice(0, limit)
      return { hashtags, count: hashtags.length, platform }
    }

    case 'update_scheduled_post':
      return posts.updateScheduledPost({
        id: input.id as string,
        content: input.content as string | undefined,
        scheduledAt: input.scheduledAt as string | undefined,
        platforms: input.platforms as ('twitter' | 'linkedin' | 'instagram' | 'facebook' | 'tiktok' | 'pinterest' | 'youtube')[] | undefined,
        mediaUrls: input.mediaUrls as string[] | undefined,
      })

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const { messages } = (await req.json()) as {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  }

  const anthropic = new Anthropic({ apiKey })
  const encoder = new TextEncoder()
  const systemPrompt = `You are an AI assistant connected to the user's Publer social media management workspace.
You have tools to list scheduled posts, view the content calendar, check follower metrics, get best posting times, fetch engagement summaries, generate captions, generate hashtags, and update scheduled posts.

Today: ${new Date().toISOString().split('T')[0]}

Guidelines:
- Always fetch real data with tools before answering questions about posts, accounts, or performance.
- Be concise and specific — give actionable recommendations.
- Note: creating, scheduling, and deleting posts is not supported via the Publer v1 API. Direct the user to the Publer web app for those actions.
- Format numbers cleanly and use natural language for dates.`

  const stream = new ReadableStream({
    async start(controller) {
      function emit(obj: object) {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'))
      }

      try {
        const anthropicMessages: Anthropic.Messages.MessageParam[] = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }))

        let iterations = 0
        let continueLoop = true

        while (continueLoop && iterations < 10) {
          iterations++

          const msgStream = anthropic.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 4096,
            system: systemPrompt,
            tools: TOOLS,
            messages: anthropicMessages,
          })

          msgStream.on('text', (text) => emit({ type: 'text', delta: text }))

          const response = await msgStream.finalMessage()
          anthropicMessages.push({ role: 'assistant', content: response.content })

          if (response.stop_reason === 'tool_use') {
            const toolResults: Anthropic.Messages.ToolResultBlockParam[] = []

            for (const block of response.content) {
              if (block.type !== 'tool_use') continue

              emit({ type: 'tool_start', id: block.id, tool: block.name, params: block.input })
              const startedAt = Date.now()

              try {
                const result = await executeTool(
                  block.name,
                  block.input as Record<string, unknown>
                )
                const duration = Date.now() - startedAt
                emit({ type: 'tool_done', id: block.id, tool: block.name, result, duration })
                toolResults.push({
                  type: 'tool_result',
                  tool_use_id: block.id,
                  content: JSON.stringify(result),
                })
              } catch (err) {
                const message = err instanceof Error ? err.message : 'Tool execution failed'
                const duration = Date.now() - startedAt
                emit({
                  type: 'tool_done',
                  id: block.id,
                  tool: block.name,
                  result: { error: message },
                  duration,
                })
                toolResults.push({
                  type: 'tool_result',
                  tool_use_id: block.id,
                  content: JSON.stringify({ error: message }),
                  is_error: true,
                })
              }
            }

            anthropicMessages.push({ role: 'user', content: toolResults })
          } else {
            continueLoop = false
          }
        }

        emit({ type: 'done' })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Chat request failed'
        emit({ type: 'error', message })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
