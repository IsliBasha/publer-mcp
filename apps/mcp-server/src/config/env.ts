import { z } from 'zod'

const EnvSchema = z
  .object({
    PUBLER_API_KEY: z.string().min(1).optional(),
    PUBLER_MOCK: z.enum(['true', 'false']).default('false'),
    ANTHROPIC_API_KEY: z.string().optional(),
    MCP_SERVER_NAME: z.string().default('publer-mcp'),
    MCP_SERVER_VERSION: z.string().default('1.0.0'),
    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
    API_BASE_URL: z.string().url().optional().default('http://localhost:3001'),
  })
  .superRefine((data, ctx) => {
    if (data.PUBLER_MOCK !== 'true' && !data.PUBLER_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'PUBLER_API_KEY is required when PUBLER_MOCK is not enabled',
        path: ['PUBLER_API_KEY'],
      })
    }
  })

function loadEnv() {
  const result = EnvSchema.safeParse(process.env)
  if (!result.success) {
    const errors = result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')
    process.stderr.write(`[publer-mcp] Invalid configuration:\n${errors}\n`)
    process.exit(1)
  }
  if (result.data.PUBLER_MOCK === 'true') {
    process.stderr.write('[publer-mcp] Running in MOCK mode — no real API calls will be made\n')
  }
  return result.data
}

export const env = loadEnv()
