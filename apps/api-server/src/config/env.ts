import { z } from 'zod'

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  PUBLER_API_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().optional(),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
  JWT_SECRET: z.string().min(32),
})

const result = EnvSchema.safeParse(process.env)
if (!result.success) {
  console.error('Invalid environment:', result.error.flatten())
  process.exit(1)
}

export const env = result.data
