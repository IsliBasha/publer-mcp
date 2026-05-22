import { z } from 'zod'
import { PlatformSchema } from './common.js'

export const PostStatusSchema = z.enum([
  'draft',
  'scheduled',
  'published',
  'failed',
  'cancelled',
])
export type PostStatus = z.infer<typeof PostStatusSchema>

export const CreatePostSchema = z.object({
  content: z.string().min(1).max(5000).describe('The post content/caption'),
  platforms: z.array(PlatformSchema).min(1).describe('Target social platforms'),
  mediaUrls: z.array(z.string().url()).optional().describe('Media attachment URLs'),
  publishNow: z.boolean().default(false).describe('Publish immediately if true'),
  scheduledAt: z
    .string()
    .datetime()
    .optional()
    .describe('ISO 8601 datetime for scheduled publishing'),
  accountIds: z
    .array(z.string())
    .optional()
    .describe('Specific account IDs to publish to'),
})
export type CreatePost = z.infer<typeof CreatePostSchema>

export const SchedulePostSchema = CreatePostSchema.extend({
  scheduledAt: z.string().datetime().describe('ISO 8601 datetime for publishing'),
  timezone: z.string().default('UTC').describe('IANA timezone (e.g. America/New_York)'),
  recurring: z
    .object({
      frequency: z.enum(['daily', 'weekly', 'monthly']),
      endDate: z.string().datetime().optional(),
    })
    .optional(),
})
export type SchedulePost = z.infer<typeof SchedulePostSchema>

export const ScheduledPostSchema = z.object({
  id: z.string(),
  content: z.string(),
  platforms: z.array(PlatformSchema),
  scheduledAt: z.string().datetime(),
  status: PostStatusSchema,
  accountIds: z.array(z.string()),
  mediaUrls: z.array(z.string()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  publerPostId: z.string().optional(),
})
export type ScheduledPost = z.infer<typeof ScheduledPostSchema>

export const UpdateScheduledPostSchema = z.object({
  id: z.string().describe('The scheduled post ID to update'),
  content: z.string().min(1).max(5000).optional(),
  scheduledAt: z.string().datetime().optional(),
  platforms: z.array(PlatformSchema).optional(),
  mediaUrls: z.array(z.string().url()).optional(),
})
export type UpdateScheduledPost = z.infer<typeof UpdateScheduledPostSchema>
