import Anthropic from '@anthropic-ai/sdk'
import type { GenerateHashtagsInput, GeneratedHashtags } from './types.js'

const PLATFORM_HASHTAG_COUNTS: Record<string, number> = {
  instagram: 30,
  twitter: 3,
  linkedin: 5,
  facebook: 3,
  tiktok: 10,
  pinterest: 20,
  youtube: 15,
}

export class HashtagService {
  constructor(private readonly client: Anthropic) {}

  async generate(input: GenerateHashtagsInput): Promise<GeneratedHashtags> {
    const maxCount = input.count ?? PLATFORM_HASHTAG_COUNTS[input.platform] ?? 10
    const nicheNote = input.niche ? ` in the ${input.niche} niche` : ''

    const prompt = `Generate ${maxCount} hashtags for a ${input.platform} post about: ${input.topic}${nicheNote}

Rules:
- Mix popular (10M+ posts), medium (100k-10M posts), and niche (<100k posts) hashtags in roughly a 20/50/30 ratio
- No spaces in hashtags, use camelCase for multi-word tags
- Include both broad and specific tags
- Do NOT include the # symbol — just the words
- Return as a JSON array of strings, nothing else. Example: ["hashtag1","hashtag2"]`

    const message = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '[]'
    let hashtags: string[] = []

    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        hashtags = JSON.parse(jsonMatch[0]) as string[]
      } else {
        hashtags = raw
          .split(/[\n,]+/)
          .map((h) => h.replace(/[^a-zA-Z0-9_]/g, '').trim())
          .filter(Boolean)
          .slice(0, maxCount)
      }
    } catch {
      hashtags = raw
        .split(/[\n,]+/)
        .map((h) => h.replace(/[^a-zA-Z0-9_]/g, '').trim())
        .filter(Boolean)
        .slice(0, maxCount)
    }

    return {
      hashtags: hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)),
      platform: input.platform,
      mixStrategy: '20% high-volume / 50% medium / 30% niche',
    }
  }
}
