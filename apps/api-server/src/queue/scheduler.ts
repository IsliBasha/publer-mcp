import { Queue, Worker, Job } from 'bullmq'
import { Redis } from 'ioredis'
import { prisma } from '../db/prisma.js'
import { createPublerServices } from '@publer-mcp/publer-client'
import { logger } from '../config/logger.js'
import { env } from '../config/env.js'

export const POST_QUEUE_NAME = 'post-publishing'

let queue: Queue | null = null
let worker: Worker | null = null

export function getQueue(): Queue {
  if (!queue) {
    const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null })
    queue = new Queue(POST_QUEUE_NAME, { connection })
  }
  return queue
}

interface PublishJobData {
  postId: string
  content: string
  platforms: string[]
  accountIds: string[]
  mediaUrls: string[]
  publerJobId?: string
}

export async function schedulePostJob(postId: string, data: PublishJobData, scheduledAt: Date) {
  const q = getQueue()
  const delay = scheduledAt.getTime() - Date.now()

  const job = await q.add('publish-post', data, {
    jobId: `post-${postId}`,
    delay: Math.max(0, delay),
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 },
  })

  logger.info({ jobId: job.id, postId, delay }, 'Scheduled post job')
  return job.id
}

export async function cancelPostJob(postId: string): Promise<void> {
  const q = getQueue()
  const job = await q.getJob(`post-${postId}`)
  if (job) {
    await job.remove()
    logger.info({ postId }, 'Cancelled post job')
  }
}

export function startWorker(io?: import('socket.io').Server) {
  const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null })
  const services = createPublerServices(env.PUBLER_API_KEY)

  worker = new Worker<PublishJobData>(
    POST_QUEUE_NAME,
    async (job: Job<PublishJobData>) => {
      logger.info({ jobId: job.id, postId: job.data.postId }, 'Processing publish job')

      await prisma.scheduledPost.update({
        where: { id: job.data.postId },
        data: { status: 'published' },
      })

      await prisma.auditLog.create({
        data: {
          action: 'post_published',
          entityType: 'ScheduledPost',
          entityId: job.data.postId,
          metadata: { jobId: job.id, platforms: job.data.platforms },
        },
      })

      io?.emit('post:published', { postId: job.data.postId, platforms: job.data.platforms })

      logger.info({ jobId: job.id, postId: job.data.postId }, 'Post published successfully')
    },
    { connection, concurrency: 5 }
  )

  worker.on('failed', async (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, 'Job failed')
    if (job?.data.postId) {
      await prisma.scheduledPost
        .update({
          where: { id: job.data.postId },
          data: { status: 'failed' },
        })
        .catch(() => null)
    }
    io?.emit('post:failed', { postId: job?.data.postId, error: err.message })
  })

  logger.info('Queue worker started')
  return worker
}
