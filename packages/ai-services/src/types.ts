import type { Platform } from '@publer-mcp/shared-types'

export type CaptionTone = 'professional' | 'casual' | 'humorous' | 'inspirational' | 'viral' | 'marketing'

export interface GenerateCaptionInput {
  topic: string
  platform: Platform
  tone: CaptionTone
  keywords?: string[]
  maxLength?: number
  includeEmojis?: boolean
  includeHashtags?: boolean
}

export interface GeneratedCaption {
  caption: string
  platform: Platform
  tone: CaptionTone
  characterCount: number
  estimatedEngagement: 'low' | 'medium' | 'high'
  score: number
}

export interface GenerateHashtagsInput {
  topic: string
  platform: Platform
  count?: number
  niche?: string
}

export interface GeneratedHashtags {
  hashtags: string[]
  platform: Platform
  mixStrategy: string
}

export interface ContentCalendarEntry {
  day: number
  dayName: string
  suggestedTime: string
  topic: string
  caption: string
  hashtags: string[]
  platform: Platform
  tone: CaptionTone
}

export interface GenerateCalendarInput {
  brand: string
  industry: string
  platforms: Platform[]
  weekStartDate?: string
}
