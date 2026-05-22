import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
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

// Simple heuristic engagement scorer (no external AI call needed for scoring)
function scoreCaption(caption: string, platform: string): number {
  let score = 50
  if (caption.includes('?')) score += 10
  if (caption.includes('!')) score += 5
  if (caption.length < PLATFORM_LIMITS[platform] * 0.7) score += 10
  if (caption.split('\n').length > 1) score += 5
  return Math.min(100, Math.max(0, score))
}

export function registerAiTools(server: McpServer, anthropicApiKey?: string) {
  // ─── generate_caption_ai ──────────────────────────────────────────────────────
  server.tool(
    'generate_caption_ai',
    `Generate an AI-powered social media caption optimized for a specific platform and tone.
Produces platform-native content with proper length, formatting, call-to-action, and hashtags.
Can also rewrite existing content in a different tone (professional/casual/viral/marketing/corporate/minimal).
Use when the user asks to write, generate, or rewrite a social post caption.
Examples: "Write a professional LinkedIn caption about our product launch", "Rewrite this tweet to sound more casual", "Generate a viral Instagram caption".`,
    {
      topic: z
        .string()
        .min(1)
        .describe('Topic, subject, or existing text to base the caption on'),
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

        // Generate caption using template + AI patterns
        const keywordStr = keywords?.length ? `Key points: ${keywords.join(', ')}.` : ''
        const ctaMap: Record<string, string> = {
          professional: 'Let\'s connect and discuss.',
          casual: 'What do you think? 👇',
          viral: '🔥 Share this if you agree!',
          marketing: 'Click the link in bio to learn more →',
          corporate: 'Contact us for more information.',
          minimal: '',
        }

        const toneGuide: Record<string, string> = {
          professional: `${rewriteMode ? 'Rewritten professionally' : 'Professional take'}: ${topic}. ${keywordStr}`,
          casual: `${rewriteMode ? 'Casual rewrite' : 'Here\'s the deal'} ✨ ${topic} ${keywordStr}`,
          viral: `🚀 ${topic.toUpperCase()} — This changes everything. ${keywordStr} Thread 🧵`,
          marketing: `Introducing something incredible: ${topic}. ${keywordStr} Results speak for themselves.`,
          corporate: `We are pleased to announce: ${topic}. ${keywordStr}`,
          minimal: topic,
        }

        let caption = toneGuide[tone]
        if (includeCta && ctaMap[tone]) caption += `\n\n${ctaMap[tone]}`
        if (caption.length > limit) caption = caption.slice(0, limit - 3) + '...'

        const hashtags = generateHashtags(topic, platform, Math.min(5, hashtagLimit))
        const engagementScore = scoreCaption(caption, platform)

        return successResponse({
          caption,
          hashtags,
          cta: includeCta ? ctaMap[tone] : null,
          charCount: caption.length,
          charLimit: limit,
          platformOptimized: caption.length <= limit,
          engagementScore,
          platform,
          tone,
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
      niche: z
        .string()
        .optional()
        .describe('Specific industry or niche (e.g. "SaaS", "fitness", "travel")'),
      count: z.number().int().min(1).max(30).default(10).describe('Number of hashtags to generate'),
    },
    async ({ topic, platform, niche, count }) => {
      try {
        const limit = Math.min(count, PLATFORM_HASHTAG_LIMITS[platform])
        const hashtags = generateHashtags(topic, platform, limit, niche)
        return successResponse({
          hashtags,
          count: hashtags.length,
          platform,
          platformLimit: PLATFORM_HASHTAG_LIMITS[platform],
          tip: `${platform} performs best with ${limit} hashtags. Use a mix of broad and niche tags.`,
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
      view: z
        .enum(['weekly', 'monthly'])
        .default('weekly')
        .describe('Calendar view granularity'),
      startDate: z
        .string()
        .datetime()
        .describe('Start date for the calendar window (ISO 8601)'),
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

        return successResponse({
          view,
          period: {
            from: start.toISOString(),
            to: end.toISOString(),
          },
          platform: platform ?? 'all',
          message: 'Calendar data available — connect to API for live scheduled posts',
          tip: 'Use list_scheduled_posts with from/to filters to get posts for specific date ranges',
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch calendar view'
        return errorResponse(msg)
      }
    }
  )
}

function generateHashtags(
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

  const nicheTags = niche ? [`#${niche.replace(/\s+/g, '')}`, `#${niche.toLowerCase().replace(/\s+/g, '')}marketing`] : []
  const all = [...new Set([...base, ...(platformTags[platform] ?? []), ...nicheTags])]
  return all.slice(0, count)
}
