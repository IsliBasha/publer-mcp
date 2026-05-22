import { z } from 'zod'

export const PlatformSchema = z.enum([
  'twitter',
  'linkedin',
  'instagram',
  'facebook',
  'tiktok',
  'pinterest',
  'youtube',
])
export type Platform = z.infer<typeof PlatformSchema>

export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})
export type Pagination = z.infer<typeof PaginationSchema>

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.nullable(),
    error: z.string().nullable(),
    meta: z
      .object({
        total: z.number().optional(),
        page: z.number().optional(),
        limit: z.number().optional(),
      })
      .optional(),
  })

export const DateRangeSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
})
export type DateRange = z.infer<typeof DateRangeSchema>
