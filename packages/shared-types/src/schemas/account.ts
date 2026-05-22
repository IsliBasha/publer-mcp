import { z } from 'zod'
import { PlatformSchema } from './common.js'

export const SocialAccountSchema = z.object({
  id: z.string(),
  platform: PlatformSchema,
  name: z.string(),
  username: z.string(),
  avatarUrl: z.string().url().optional(),
  workspaceId: z.string(),
  isConnected: z.boolean(),
  connectedAt: z.string().datetime(),
})
export type SocialAccount = z.infer<typeof SocialAccountSchema>

export const WorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  accounts: z.array(SocialAccountSchema),
  createdAt: z.string().datetime(),
})
export type Workspace = z.infer<typeof WorkspaceSchema>
