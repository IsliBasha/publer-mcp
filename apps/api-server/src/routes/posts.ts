import { Router } from 'express'
import { z } from 'zod'
import { createPublerServices } from '@publer-mcp/publer-client'
import { prisma } from '../db/prisma.js'
import { schedulePostJob } from '../queue/scheduler.js'
import { env } from '../config/env.js'

const router: Router = Router()
const services = createPublerServices(env.PUBLER_API_KEY)

router.get('/', async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1)
    const limit = Number(req.query.limit ?? 20)
    const result = await services.posts.listScheduledPosts({
      page,
      limit,
      platform: req.query.platform as string | undefined,
    })
    res.json({ success: true, data: result, meta: { page, limit, total: result.total } })
  } catch (err) {
    next(err)
  }
})

router.post('/schedule', async (req, res, next) => {
  const BodySchema = z.object({
    content: z.string().min(1).max(5000),
    platforms: z.array(z.string()).min(1),
    scheduledAt: z.string().datetime(),
    timezone: z.string().default('UTC'),
    accountIds: z.array(z.string()).optional(),
    mediaUrls: z.array(z.string().url()).optional(),
  })

  try {
    const data = BodySchema.parse(req.body)

    // Persist to local DB
    const post = await prisma.scheduledPost.create({
      data: {
        content: data.content,
        platforms: data.platforms,
        scheduledAt: new Date(data.scheduledAt),
        status: 'scheduled',
        accountIds: data.accountIds ?? [],
        mediaUrls: data.mediaUrls ?? [],
        workspaceId: 'default-workspace',
      },
    })

    // Enqueue for publishing
    await schedulePostJob(post.id, {
      postId: post.id,
      content: data.content,
      platforms: data.platforms,
      accountIds: data.accountIds ?? [],
      mediaUrls: data.mediaUrls ?? [],
    }, new Date(data.scheduledAt))

    res.status(201).json({ success: true, data: post })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await services.posts.deletePost(req.params.id)
    await prisma.scheduledPost.update({
      where: { id: req.params.id },
      data: { status: 'cancelled' },
    })
    res.json({ success: true, data: { deleted: req.params.id } })
  } catch (err) {
    next(err)
  }
})

export { router as postsRouter }
