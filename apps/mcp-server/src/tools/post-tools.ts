import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { PostsService } from '@publer-mcp/publer-client'
import { successResponse, errorResponse } from '../utils/response.js'

export function registerPostTools(server: McpServer, postsService: PostsService) {
  // ─── create_post ────────────────────────────────────────────────────────────
  server.tool(
    'create_post',
    `Publish a social media post immediately to one or more platforms via Publer.
Use this when the user wants to post right now (not schedule for later).
Supports Twitter/X, LinkedIn, Instagram, Facebook, TikTok, Pinterest, YouTube.
Examples: "Post this to LinkedIn now", "Share this update across all accounts".`,
    {
      content: z
        .string()
        .min(1)
        .max(5000)
        .describe('The post text/caption. Max 5000 chars.'),
      platforms: z
        .array(z.enum(['twitter', 'linkedin', 'instagram', 'facebook', 'tiktok', 'pinterest', 'youtube']))
        .min(1)
        .describe('Target social platforms'),
      mediaUrls: z
        .array(z.string().url())
        .optional()
        .describe('Optional image/video URLs to attach'),
      accountIds: z
        .array(z.string())
        .optional()
        .describe('Specific account IDs (uses all connected accounts if omitted)'),
    },
    async ({ content, platforms, mediaUrls, accountIds }) => {
      try {
        const post = await postsService.createPost({
          content,
          platforms,
          mediaUrls,
          accountIds,
          publishNow: true,
        })
        return successResponse({ message: 'Post published successfully', post })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create post'
        return errorResponse(msg, { content: content.slice(0, 100) })
      }
    }
  )

  // ─── schedule_post ──────────────────────────────────────────────────────────
  server.tool(
    'schedule_post',
    `Schedule a social media post for a specific future date and time.
Use when the user specifies a future time like "tomorrow at 9 AM", "next Monday", or an ISO datetime.
Supports recurring schedules (daily/weekly/monthly) and timezone-aware scheduling.
Examples: "Schedule a LinkedIn post for tomorrow at 9 AM", "Post this every Monday at 10 AM".`,
    {
      content: z.string().min(1).max(5000).describe('Post content/caption'),
      platforms: z
        .array(z.enum(['twitter', 'linkedin', 'instagram', 'facebook', 'tiktok', 'pinterest', 'youtube']))
        .min(1),
      scheduledAt: z
        .string()
        .datetime()
        .describe('ISO 8601 datetime when to publish (e.g. 2024-12-25T09:00:00Z)'),
      timezone: z
        .string()
        .default('UTC')
        .describe('IANA timezone name (e.g. America/New_York, Europe/London)'),
      accountIds: z.array(z.string()).optional(),
      mediaUrls: z.array(z.string().url()).optional(),
      recurring: z
        .object({
          frequency: z.enum(['daily', 'weekly', 'monthly']),
          endDate: z.string().datetime().optional(),
        })
        .optional()
        .describe('Make this a recurring post'),
    },
    async ({ content, platforms, scheduledAt, timezone, accountIds, mediaUrls, recurring }) => {
      try {
        const post = await postsService.schedulePost({
          content,
          platforms,
          scheduledAt,
          timezone,
          accountIds,
          mediaUrls,
          recurring,
          publishNow: false,
        })
        return successResponse({
          message: `Post scheduled for ${scheduledAt}`,
          post,
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to schedule post'
        return errorResponse(msg)
      }
    }
  )

  // ─── list_scheduled_posts ────────────────────────────────────────────────────
  server.tool(
    'list_scheduled_posts',
    `List all upcoming scheduled posts from Publer's content calendar.
Use when the user asks to see their content calendar, scheduled posts, or upcoming content.
Can filter by platform, date range, or account.
Examples: "Show my scheduled posts", "What's on my calendar this week?", "Show scheduled Instagram posts".`,
    {
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(50).default(20),
      platform: z
        .enum(['twitter', 'linkedin', 'instagram', 'facebook', 'tiktok', 'pinterest', 'youtube'])
        .optional()
        .describe('Filter by platform'),
      from: z.string().datetime().optional().describe('Start of date range (ISO 8601)'),
      to: z.string().datetime().optional().describe('End of date range (ISO 8601)'),
    },
    async ({ page, limit, platform, from, to }) => {
      try {
        const result = await postsService.listScheduledPosts({ page, limit, platform, from, to })
        return successResponse({ ...result, page, limit })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch scheduled posts'
        return errorResponse(msg)
      }
    }
  )

  // ─── update_scheduled_post ───────────────────────────────────────────────────
  server.tool(
    'update_scheduled_post',
    `Modify an existing scheduled post — change its content, reschedule the time, or swap platforms.
Use when the user wants to edit, reschedule, or update a post that hasn't been published yet.
Requires the post ID (use list_scheduled_posts to find it first if unknown).
Examples: "Reschedule post abc123 to Friday", "Update the content of my LinkedIn post".`,
    {
      id: z.string().describe('The scheduled post ID to update'),
      content: z.string().min(1).max(5000).optional().describe('New post content'),
      scheduledAt: z.string().datetime().optional().describe('New scheduled time (ISO 8601)'),
      platforms: z
        .array(z.enum(['twitter', 'linkedin', 'instagram', 'facebook', 'tiktok', 'pinterest', 'youtube']))
        .optional(),
      mediaUrls: z.array(z.string().url()).optional(),
    },
    async ({ id, content, scheduledAt, platforms, mediaUrls }) => {
      try {
        const post = await postsService.updateScheduledPost({ id, content, scheduledAt, platforms, mediaUrls })
        return successResponse({ message: 'Post updated successfully', post })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to update post'
        return errorResponse(msg, { postId: id })
      }
    }
  )

  // ─── delete_post ─────────────────────────────────────────────────────────────
  server.tool(
    'delete_post',
    `Delete a scheduled or published post from Publer. This action is irreversible.
Use when the user wants to cancel, remove, or delete a scheduled post.
Examples: "Delete post abc123", "Cancel my scheduled Instagram post", "Remove this from my calendar".`,
    {
      postId: z.string().describe('The post ID to delete'),
      confirm: z
        .boolean()
        .default(false)
        .describe('Must be true to confirm deletion (safeguard against accidental calls)'),
    },
    async ({ postId, confirm }) => {
      if (!confirm) {
        return errorResponse(
          'Deletion requires explicit confirmation. Set confirm=true to proceed.',
          { postId }
        )
      }
      try {
        await postsService.deletePost(postId)
        return successResponse({ message: `Post ${postId} deleted successfully`, postId })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to delete post'
        return errorResponse(msg, { postId })
      }
    }
  )
}
