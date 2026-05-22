import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import Anthropic from '@anthropic-ai/sdk'
import type { PostsService } from '@publer-mcp/publer-client'
import { successResponse, errorResponse } from '../utils/response.js'

const PLATFORM_LIMITS: Record<string, number> = {
  twitter: 280,
  linkedin: 3000,
  instagram: 2200,
  facebook: 63206,
  tiktok: 2200,
  pinterest: 500,
  youtube: 5000,
}

const PLATFORM_HASHTAG_LIMITS: Record<string, number> = {
  twitter: 2,
  linkedin: 5,
  instagram: 30,
  facebook: 10,
  tiktok: 10,
  pinterest: 20,
  youtube: 15,
}

function scoreCaption(caption: string, platform: string): number {
  let score = 50
  if (caption.includes('?')) score += 10
  if (caption.includes('!')) score += 5
  if (caption.length < PLATFORM_LIMITS[platform] * 0.7) score += 10
  if (caption.split('\n').length > 1) score += 5
  if (/[\u{1F300}-\u{1FAFF}]/u.test(caption)) score += 5
  return Math.min(100, Math.max(0, score))
}

function extractHashtags(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('#'))
    .map((l) => l.split(/\s/)[0])
    .filter(Boolean)
}

function generateFallbackHashtags(
  topic: string,
  platform: string,
  count: number,
  niche?: string
): string[] {
  const words = topic.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
  const base = words.map((w) => `#${w.replace(/[^a-z0-9]/g, '')}`)
  const platformTags: Record<string, string[]> = {
    twitter: ['#trending', '#viral'],
    linkedin: ['#business', '#leadership', '#innovation', '#growth', '#entrepreneurship'],
    instagram: ['#instagood', '#photooftheday', '#content', '#creator', '#socialmedia'],
    facebook: ['#community', '#share'],
    tiktok: ['#fyp', '#foryou', '#trending', '#viral'],
    pinterest: ['#ideas', '#inspiration', '#design'],
    youtube: ['#youtube', '#youtuber', '#subscribe'],
  }
  const nicheTags = niche
    ? [`#${niche.replace(/\s+/g, '')}`, `#${niche.toLowerCase().replace(/\s+/g, '')}marketing`]
    : []
  return [...new Set([...base, ...(platformTags[platform] ?? []), ...nicheTags])].slice(0, count)
}

export function registerAiTools(
  server: McpServer,
  postsService: PostsService,
  anthropicApiKey?: string
) {
  const anthropic = anthropicApiKey ? new Anthropic({ apiKey: anthropicApiKey }) : null

  // ─── generate_caption_ai ──────────────────────────────────────────────────────
  server.tool(
    'generate_caption_ai',
    `Generate an AI-powered social media caption optimized for a specific platform and tone.
Produces platform-native content with proper length, formatting, call-to-action, and hashtags.
Can also rewrite existing content in a different tone (professional/casual/viral/marketing/corporate/minimal).
Use when the user asks to write, generate, or rewrite a social post caption.
Examples: "Write a professional LinkedIn caption about our product launch", "Rewrite this tweet to sound more casual", "Generate a viral Instagram caption".`,
    {
      topic: z.string().min(1).describe('Topic, subject, or existing text to base the caption on'),
      platform: z
        .enum(['twitter', 'linkedin', 'instagram', 'facebook', 'tiktok', 'pinterest', 'youtube'])
        .describe('Target platform — determines length and formatting'),
      tone: z
        .enum(['professional', 'casual', 'viral', 'marketing', 'corporate', 'minimal'])
        .default('professional')
        .describe('Writing tone and style'),
      keywords: z.array(z.string()).optional().describe('Keywords or phrases to incorporate'),
      includeCta: z.boolean().default(true).describe('Include a call-to-action'),
      rewriteMode: z
        .boolean()
        .default(false)
        .describe('If true, treats topic as existing content to rewrite'),
    },
    async ({ topic, platform, tone, keywords, includeCta, rewriteMode }) => {
      try {
        const limit = PLATFORM_LIMITS[platform]
        const hashtagLimit = PLATFORM_HASHTAG_LIMITS[platform]
        let caption: string
        let hashtags: string[]

        if (anthropic) {
          const platformGuide: Record<string, string> = {
            twitter: 'Punchy, max 280 chars, 1-2 hashtags at end',
            linkedin: 'Professional, line breaks for readability, insight or question at end, 3-5 hashtags',
            instagram: 'Engaging opener, emojis, storytelling, hashtags at end',
            facebook: 'Conversational, community-focused, question or CTA',
            tiktok: 'Hook in first 3 words, trendy language, 3-5 hashtags',
            pinterest: 'Descriptive, keyword-rich, max 500 chars',
            youtube: 'SEO-optimized, clear value proposition',
          }
          const toneGuide: Record<string, string> = {
            professional: 'authoritative, data-driven, business-focused',
            casual: 'friendly, conversational, relatable, uses contractions',
            viral: 'emotionally charged, curiosity-gap, shareable, urgency',
            marketing: 'benefit-led, persuasive, action-oriented',
            corporate: 'formal, polished, brand-safe',
            minimal: 'concise, understated, no filler words',
          }
          const prompt = [
            rewriteMode
              ? `Rewrite the following content for ${platform} in a ${tone} tone:`
              : `Write a ${tone} ${platform} caption about:`,
            `"${topic}"`,
            keywords?.length ? `Include these keywords naturally: ${keywords.join(', ')}.` : '',
            `Platform rules: ${platformGuide[platform]}`,
            `Tone style: ${toneGuide[tone]}`,
            includeCta ? 'End with a strong call-to-action.' : 'No call-to-action.',
            `Stay under ${limit} characters total.`,
            `Add ${Math.min(5, hashtagLimit)} relevant hashtags at the very end.`,
            'Return ONLY the caption text with hashtags. No explanation, no surrounding quotes.',
          ]
            .filter(Boolean)
            .join('\n')

          const msg = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }],
          })

          const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : topic
          caption = raw.length > limit ? raw.slice(0, limit - 3) + '...' : raw
          hashtags = extractHashtags(caption)
        } else {
          const ctaMap: Record<string, string> = {
            professional: "Let's connect and discuss.",
            casual: 'What do you think? 👇',
            viral: '🔥 Share this if you agree!',
            marketing: 'Click the link in bio →',
            corporate: 'Contact us for more information.',
            minimal: '',
          }
          caption = `${topic}${keywords?.length ? ` — ${keywords.join(', ')}` : ''}`
          if (includeCta && ctaMap[tone]) caption += `\n\n${ctaMap[tone]}`
          if (caption.length > limit) caption = caption.slice(0, limit - 3) + '...'
          hashtags = generateFallbackHashtags(topic, platform, Math.min(5, hashtagLimit))
        }

        return successResponse({
          caption,
          hashtags,
          charCount: caption.length,
          charLimit: limit,
          platformOptimized: caption.length <= limit,
          engagementScore: scoreCaption(caption, platform),
          platform,
          tone,
          generatedBy: anthropic ? 'claude-haiku' : 'template',
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to generate caption'
        return errorResponse(msg)
      }
    }
  )

  // ─── generate_hashtags ────────────────────────────────────────────────────────
  server.tool(
    'generate_hashtags',
    `Generate optimized hashtags for a social media post based on topic, platform, and niche.
Returns platform-appropriate hashtag counts with trending and niche-specific suggestions.
Use when the user asks for hashtags, wants to improve discoverability, or needs hashtag suggestions.
Examples: "Generate hashtags for a tech startup post", "What hashtags should I use for Instagram fitness content?", "Give me LinkedIn hashtags for marketing".`,
    {
      topic: z.string().min(1).describe('The content topic or theme'),
      platform: z
        .enum(['twitter', 'linkedin', 'instagram', 'facebook', 'tiktok', 'pinterest', 'youtube'])
        .describe('Target platform — determines optimal hashtag count'),
      niche: z.string().optional().describe('Specific industry or niche (e.g. "SaaS", "fitness", "travel")'),
      count: z.number().int().min(1).max(30).default(10).describe('Number of hashtags to generate'),
    },
    async ({ topic, platform, niche, count }) => {
      try {
        const limit = Math.min(count, PLATFORM_HASHTAG_LIMITS[platform])
        let hashtags: string[]

        if (anthropic) {
          const prompt = [
            `Generate exactly ${limit} hashtags for ${platform} about: "${topic}"`,
            niche ? `Industry/niche: ${niche}` : '',
            'Rules:',
            '- One hashtag per line, each starting with #',
            '- Mix 2 broad/popular tags with niche-specific and long-tail tags',
            `- Optimized for ${platform} discoverability`,
            '- No spaces inside hashtags, no punctuation',
            '- Return ONLY the hashtags, one per line, nothing else',
          ]
            .filter(Boolean)
            .join('\n')

          const msg = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 256,
            messages: [{ role: 'user', content: prompt }],
          })

          const raw = msg.content[0].type === 'text' ? msg.content[0].text : ''
          hashtags = extractHashtags(raw).slice(0, limit)

          if (hashtags.length < limit) {
            const fallback = generateFallbackHashtags(topic, platform, limit - hashtags.length, niche)
            hashtags = [...new Set([...hashtags, ...fallback])].slice(0, limit)
          }
        } else {
          hashtags = generateFallbackHashtags(topic, platform, limit, niche)
        }

        return successResponse({
          hashtags,
          count: hashtags.length,
          platform,
          platformLimit: PLATFORM_HASHTAG_LIMITS[platform],
          tip: `${platform} performs best with ${limit} hashtags. Use a mix of broad and niche tags.`,
          generatedBy: anthropic ? 'claude-haiku' : 'template',
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to generate hashtags'
        return errorResponse(msg)
      }
    }
  )

  // ─── content_calendar_view ────────────────────────────────────────────────────
  server.tool(
    'content_calendar_view',
    `Return a structured calendar view of scheduled content for a given week or month.
Groups posts by date, shows platform distribution, and highlights publishing gaps.
Use when the user wants to see their content calendar, plan content, or review what's scheduled when.
Examples: "Show my content calendar for this week", "What am I posting next month?", "Show my calendar view".`,
    {
      view: z.enum(['weekly', 'monthly']).default('weekly').describe('Calendar view granularity'),
      startDate: z.string().datetime().describe('Start date for the calendar window (ISO 8601)'),
      platform: z
        .enum(['twitter', 'linkedin', 'instagram', 'facebook', 'tiktok', 'pinterest', 'youtube'])
        .optional()
        .describe('Filter calendar by platform'),
    },
    async ({ view, startDate, platform }) => {
      try {
        const start = new Date(startDate)
        const end = new Date(startDate)
        if (view === 'weekly') end.setDate(end.getDate() + 7)
        else end.setMonth(end.getMonth() + 1)

        const { posts, total } = await postsService.listScheduledPosts({
          from: start.toISOString(),
          to: end.toISOString(),
          limit: 50,
          ...(platform ? { platform } : {}),
        })

        // Group posts by day
        const byDay: Record<string, { date: string; postCount: number; previews: string[] }> = {}
        for (const post of posts) {
          const day = post.scheduledAt.slice(0, 10)
          if (!byDay[day]) byDay[day] = { date: day, postCount: 0, previews: [] }
          byDay[day].postCount++
          if (byDay[day].previews.length < 2) {
            byDay[day].previews.push(post.content.slice(0, 80) + (post.content.length > 80 ? '…' : ''))
          }
        }

        // Find gap days (no posts scheduled)
        const gaps: string[] = []
        const cur = new Date(start)
        while (cur < end) {
          const day = cur.toISOString().slice(0, 10)
          if (!byDay[day]) gaps.push(day)
          cur.setDate(cur.getDate() + 1)
        }

        return successResponse({
          view,
          period: { from: start.toISOString(), to: end.toISOString() },
          platform: platform ?? 'all',
          totalScheduled: total,
          days: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
          gaps,
          gapCount: gaps.length,
          tip: gaps.length > 0 ? `${gaps.length} day(s) with no scheduled content — consider filling the gaps.` : 'Great! Every day has content scheduled.',
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch calendar view'
        return errorResponse(msg)
      }
    }
  )
}
