#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { env } from './config/env.js'
import { createPublerServices } from '@publer-mcp/publer-client'
import { registerPostTools } from './tools/post-tools.js'
import { registerAnalyticsTools } from './tools/analytics-tools.js'
import { registerAccountTools } from './tools/account-tools.js'
import { registerAiTools } from './tools/ai-tools.js'

async function main() {
  const server = new McpServer({
    name: env.MCP_SERVER_NAME,
    version: env.MCP_SERVER_VERSION,
  })

  const services = createPublerServices(env.PUBLER_API_KEY ?? '', env.PUBLER_WORKSPACE_ID)

  // Register all 13 MCP tools
  registerPostTools(server, services.posts)
  registerAnalyticsTools(server, services.analytics)
  registerAccountTools(server, services.accounts)
  registerAiTools(server, services.posts, env.ANTHROPIC_API_KEY)

  // MCP Resources — expose structured data Claude can read
  server.resource(
    'analytics://overview',
    'analytics://overview',
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({
            description: 'Publer analytics overview — use get_followers and fetch_engagement_summary for live data',
            tools: ['get_followers', 'get_post_analytics', 'fetch_engagement_summary'],
          }),
        },
      ],
    })
  )

  server.resource(
    'calendar://scheduled-posts',
    'calendar://scheduled-posts',
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({
            description: 'Upcoming scheduled content — use list_scheduled_posts or content_calendar_view',
            tools: ['list_scheduled_posts', 'content_calendar_view'],
          }),
        },
      ],
    })
  )

  // MCP Prompts — reusable workflow templates
  server.prompt(
    'generate-marketing-campaign',
    'Generate a complete social media marketing campaign with captions, hashtags, and schedule',
    {
      product: z.string().describe('Product or service to market'),
      platforms: z.string().describe('Comma-separated platforms (e.g. linkedin,instagram)'),
      duration: z.string().optional().describe('Campaign duration in days (default: 7)'),
    },
    ({ product, platforms, duration }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Create a ${duration ?? 7}-day social media marketing campaign for: ${product}\nPlatforms: ${platforms}\n\nFor each day, generate a unique caption with hashtags using generate_caption_ai, then schedule each post using schedule_post. Vary the tone across days (professional, viral, marketing, casual). Start the campaign from tomorrow.`,
          },
        },
      ],
    })
  )

  server.prompt(
    'rewrite-for-linkedin',
    'Rewrite any social content in a LinkedIn-optimized professional format',
    {
      content: z.string().describe('Original content to rewrite for LinkedIn'),
    },
    ({ content }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Use generate_caption_ai to rewrite this content for LinkedIn with a professional tone and strong engagement: "${content}"`,
          },
        },
      ],
    })
  )

  server.prompt(
    'build-weekly-content-calendar',
    'Plan and schedule a full week of social media content',
    {
      brand: z.string().describe('Brand or company name'),
      industry: z.string().describe('Industry or niche (e.g. SaaS, e-commerce, fitness)'),
    },
    ({ brand, industry }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Build a 7-day content calendar for ${brand} in the ${industry} industry. Use list_social_accounts to see available platforms, get_best_posting_time for optimal scheduling, generate_caption_ai for each post's content, generate_hashtags for discoverability, and schedule_post for each day's content. Create varied content types and tones.`,
          },
        },
      ],
    })
  )

  const transport = new StdioServerTransport()

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await server.close()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    await server.close()
    process.exit(0)
  })

  await server.connect(transport)

  // Log to stderr (not stdout — MCP uses stdout for protocol messages)
  process.stderr.write(
    `[publer-mcp] Server started. ${env.MCP_SERVER_NAME} v${env.MCP_SERVER_VERSION} ready.\n`
  )
}

main().catch((err) => {
  process.stderr.write(`[publer-mcp] Fatal error: ${err.message}\n`)
  process.exit(1)
})
