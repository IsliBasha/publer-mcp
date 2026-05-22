import Anthropic from '@anthropic-ai/sdk'
import type { ContentCalendarEntry, GenerateCalendarInput } from './types.js'

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const TONES = ['professional', 'casual', 'inspirational', 'viral', 'marketing', 'humorous', 'professional']

const BEST_TIMES: Record<string, string> = {
  linkedin: '08:00',
  twitter: '12:00',
  instagram: '11:00',
  facebook: '15:00',
  tiktok: '19:00',
  pinterest: '20:00',
  youtube: '17:00',
}

export class ContentCalendarService {
  constructor(private readonly client: Anthropic) {}

  async generateWeek(input: GenerateCalendarInput): Promise<ContentCalendarEntry[]> {
    const primaryPlatform = input.platforms[0] ?? 'linkedin'

    const prompt = `Generate a 7-day social media content calendar for ${input.brand} in the ${input.industry} industry.

Platforms: ${input.platforms.join(', ')}

Return a JSON array with exactly 7 objects (one per day). Each object must have:
- day: number (1-7)
- dayName: string ("Monday" through "Sunday")
- topic: string (specific topic for that day)
- caption: string (ready-to-post caption, 100-200 chars)
- hashtags: string[] (3-5 relevant hashtags with # prefix)

Vary topics and tones across the week. Return ONLY the JSON array, nothing else.`

    const message = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '[]'

    let parsed: Array<{
      day: number
      dayName: string
      topic: string
      caption: string
      hashtags: string[]
    }> = []

    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      // No JSON array found — return skeleton
      return DAY_NAMES.map((name, i) => ({
        day: i + 1,
        dayName: name,
        suggestedTime: BEST_TIMES[primaryPlatform] ?? '10:00',
        topic: `${input.brand} content — ${name}`,
        caption: `Sharing insights from ${input.brand} in the ${input.industry} space. Follow for more!`,
        hashtags: [`#${input.industry.replace(/\s+/g, '')}`, '#business', '#growth'],
        platform: primaryPlatform,
        tone: TONES[i] as ContentCalendarEntry['tone'],
      }))
    }
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch {
      // JSON parse failed — return skeleton
      return DAY_NAMES.map((name, i) => ({
        day: i + 1,
        dayName: name,
        suggestedTime: BEST_TIMES[primaryPlatform] ?? '10:00',
        topic: `${input.brand} content — ${name}`,
        caption: `Sharing insights from ${input.brand} in the ${input.industry} space. Follow for more!`,
        hashtags: [`#${input.industry.replace(/\s+/g, '')}`, '#business', '#growth'],
        platform: primaryPlatform,
        tone: TONES[i] as ContentCalendarEntry['tone'],
      }))
    }

    return parsed.map((entry, i) => ({
      day: entry.day,
      dayName: entry.dayName ?? DAY_NAMES[i] ?? `Day ${i + 1}`,
      suggestedTime: BEST_TIMES[primaryPlatform] ?? '10:00',
      topic: entry.topic,
      caption: entry.caption,
      hashtags: Array.isArray(entry.hashtags) ? entry.hashtags : [],
      platform: primaryPlatform,
      tone: (TONES[i] ?? 'professional') as ContentCalendarEntry['tone'],
    }))
  }
}
