import { z } from 'zod'

export const QueueJobStatusSchema = z.enum([
  'waiting',
  'active',
  'completed',
  'failed',
  'delayed',
  'paused',
])
export type QueueJobStatus = z.infer<typeof QueueJobStatusSchema>

export const QueueJobSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: QueueJobStatusSchema,
  data: z.record(z.unknown()),
  attempts: z.number().int(),
  maxAttempts: z.number().int(),
  scheduledFor: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  failedAt: z.string().datetime().optional(),
  failReason: z.string().optional(),
  createdAt: z.string().datetime(),
})
export type QueueJob = z.infer<typeof QueueJobSchema>
