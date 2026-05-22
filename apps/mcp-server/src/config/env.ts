import { z } from 'zod'

const EnvSchema = z.object({
  PUBLER_API_KEY: z.string().min(1, 'PUBLER_API_KEY is required'),
  ANTHROPIC_API_KEY: z.string().optional(),
  MCP_SERVER_NAME: z.string().default('publer-mcp'),
  MCP_SERVER_VERSION: z.string().default('1.0.0'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
  API_BASE_URL: z.string().url().optional().default('http://localhost:3001'),
})

function loadEnv() {
  const result = EnvSchema.safeParse(process.env)
  if (!result.success) {
    const errors = result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')
    process.stderr.write(`[publer-mcp] Invalid configuration:\n${errors}\n`)
    process.exit(1)
  }
  return result.data
}

export const env = loadEnv()
