import Anthropic from '@anthropic-ai/sdk'
import type { GenerateCaptionInput, GeneratedCaption } from './types.js'

const PLATFORM_LIMITS: Record<string, number> = {
  twitter: 280,
  linkedin: 3000,
  instagram: 2200,
  facebook: 63206,
  tiktok: 2200,
  pinterest: 500,
  youtube: 5000,
}

const TONE_GUIDANCE: Record<string, string> = {
  professional: 'formal, authoritative, data-driven, industry insights',
  casual: 'conversational, friendly, relatable, everyday language',
  humorous: 'witty, playful, light-hearted, clever wordplay',
  inspirational: 'motivational, uplifting, emotionally resonant, call-to-action',
  viral: 'provocative, shareable, trending hooks, controversy-adjacent but safe',
  marketing: 'persuasive, benefit-focused, urgency, clear CTA',
}

export class CaptionService {
  constructor(private readonly client: Anthropic) {}

  async generate(input: GenerateCaptionInput): Promise<GeneratedCaption> {
    const limit = input.maxLength ?? PLATFORM_LIMITS[input.platform] ?? 2200
    const emojiNote = input.includeEmojis ? 'Include relevant emojis.' : 'No emojis.'
    const hashtagNote = input.includeHashtags
      ? 'End with 3-5 relevant hashtags.'
      : 'Do not include hashtags.'
    const keywordNote = input.keywords?.length
      ? `Naturally incorporate these keywords: ${input.keywords.join(', ')}.`
      : ''

    const prompt = `Write a ${input.platform} social media caption about: ${input.topic}

Tone: ${TONE_GUIDANCE[input.tone]}
Platform: ${input.platform} (max ${limit} characters)
${emojiNote}
${hashtagNote}
${keywordNote}

Return ONLY the caption text. No explanations, no quotes around it.`

    const message = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const caption =
      message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    return {
      caption,
      platform: input.platform,
      tone: input.tone,
      characterCount: caption.length,
      estimatedEngagement: this.estimateEngagement(caption, input.platform),
      score: this.scoreCaption(caption, input),
    }
  }

  private estimateEngagement(caption: string, platform: string): 'low' | 'medium' | 'high' {
    const hasQuestion = /\?/.test(caption)
    const hasHashtags = /#\w+/.test(caption)
    const hasEmojis = /\p{Emoji}/u.test(caption)
    const score = [hasQuestion, hasHashtags, hasEmojis].filter(Boolean).length
    if (score >= 2) return 'high'
    if (score === 1) return 'medium'
    return platform === 'linkedin' ? 'medium' : 'low'
  }

  private scoreCaption(caption: string, input: GenerateCaptionInput): number {
    let score = 50
    const limit = input.maxLength ?? PLATFORM_LIMITS[input.platform] ?? 2200
    const ratio = caption.length / limit
    if (ratio > 0.2 && ratio < 0.8) score += 20
    if (/\?/.test(caption)) score += 10
    if (/#\w+/.test(caption)) score += 10
    if (/\p{Emoji}/u.test(caption)) score += 5
    if (caption.split(' ').length > 10) score += 5
    return Math.min(100, score)
  }
}
