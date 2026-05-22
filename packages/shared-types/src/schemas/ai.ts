import { z } from 'zod'
import { PlatformSchema } from './common.js'

export const CaptionToneSchema = z.enum([
  'professional',
  'casual',
  'viral',
  'marketing',
  'corporate',
  'minimal',
])
export type CaptionTone = z.infer<typeof CaptionToneSchema>

export const GenerateCaptionSchema = z.object({
  topic: z.string().describe('Topic or subject of the post'),
  tone: CaptionToneSchema.default('professional'),
  platform: PlatformSchema.describe('Target platform for length/format optimization'),
  keywords: z.array(z.string()).optional().describe('Keywords to incorporate'),
  includeCta: z.boolean().default(true).describe('Include a call-to-action'),
  existingContent: z
    .string()
    .optional()
    .describe('Existing text to rewrite (for rewrite mode)'),
})
export type GenerateCaption = z.infer<typeof GenerateCaptionSchema>

export const GeneratedCaptionSchema = z.object({
  caption: z.string(),
  hashtags: z.array(z.string()),
  cta: z.string().optional(),
  charCount: z.number().int(),
  platformOptimized: z.boolean(),
  engagementScore: z.number().min(0).max(100),
})
export type GeneratedCaption = z.infer<typeof GeneratedCaptionSchema>

export const GenerateHashtagsSchema = z.object({
  topic: z.string().describe('Content topic or theme'),
  platform: PlatformSchema,
  niche: z.string().optional().describe('Specific niche or industry'),
  count: z.number().int().min(1).max(30).default(10),
})
export type GenerateHashtags = z.infer<typeof GenerateHashtagsSchema>
